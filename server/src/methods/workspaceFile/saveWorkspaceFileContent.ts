import { WebsitePageTemplate } from "methods/websitePageTemplate/WebsitePageTemplate.model";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import { parseMultipartFormData } from "lib/formData";
import { Workspace } from "methods/workspace/Workspace.model";
import { compile } from "compiler/compile";
import mysql from "mysql2/promise";
import db from "lib/db";
import { createGuid } from "lib/base58";
import moment from "moment";

export default route(async function (params, filePath, content, compiled, dependenciesJSON) {
    console.log("SAVING CONTENT");
    let body = await parseMultipartFormData(params.req, { maxBodySize: 5_000_000 });
    let [pathBuffer, contentBuffer, compiledBuffer, dependenciesJSONBuffer] = body;
    filePath = pathBuffer.toString();
    let [_, workspaceGuid, path] = filePath.match(/\/([^\/]*)(.*)/);
    filePath = path || "/";
    let [workspace] = await Workspace.fromQuery(`SELECT Workspace.guid, Workspace.organization
        FROM Workspace
        JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
        WHERE UserOrganization.user = ? AND Workspace.guid = ?`, [params.user.guid, workspaceGuid]);


    if (!workspace) {
        throw new HttpError(400, `Workspace with guid "${workspaceGuid}" not found in this organization.`);
    }

    let [workspaceFile] = await WorkspaceFile.fromQuery(`SELECT WorkspaceFile.* 
        FROM WorkspaceFile 
        JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
        WHERE path = ? 
        AND workspace = (SELECT Workspace.guid
            FROM Workspace 
            JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
            WHERE UserOrganization.user = ? AND Workspace.guid = ?)
        AND UserOrganization.user = ?`, [filePath, params.user.guid, workspaceGuid, params.user.guid]);
    if (!workspaceFile) {
        workspaceFile = await WorkspaceFile.init({
            path: filePath,
            pathParts: filePath.split("/").slice(1),
            type: "file",
            workspace: (await WorkspaceFile.fromQuery(`SELECT Workspace.guid FROM Workspace
                JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
                WHERE UserOrganization.user = ? AND Workspace.guid = ?`, [params.user.guid, workspaceGuid]))[0].guid,
            content: contentBuffer,
            compiled: compiledBuffer,
            organization: workspace.organization
        });
    } else {
        workspaceFile.content = contentBuffer;
        workspaceFile.compiled = compiledBuffer;
    }
    workspaceFile.organization = workspace.organization;
    console.log("saving workspace file", workspaceFile);

    let dependencies = [];
    try {
        dependencies = JSON.parse(dependenciesJSONBuffer.toString('utf-8'));
    } catch (e) {
        console.error("error parsing dependencies", e);
    }

    console.log("dependencies", dependencies);
    let [existingWorkspaceFile] = await WorkspaceFile.fromQuery(`SELECT WorkspaceFile.guid
        FROM WorkspaceFile
        JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
        WHERE path = ?
        AND workspace = ?
        AND UserOrganization.user = ?`, [filePath, workspaceGuid, params.user.guid]);
    if (existingWorkspaceFile) {
        workspaceFile.guid = existingWorkspaceFile.guid;
    }
    await workspaceFile.save();
    if (Array.isArray(dependencies))
        await saveDependenciesList(workspaceFile.guid, dependencies, workspace.organization);

    await updateRelatedComponents(workspaceFile);

    let dependentComponentsResult = await db.query(`
        SELECT CONCAT('/', WorkspaceFile.workspace, WorkspaceFile.path) AS path
        FROM WorkspaceFileDependency
        JOIN WorkspaceFile ON WorkspaceFileDependency.workspaceFile = WorkspaceFile.guid
        JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
        WHERE WorkspaceFileDependency.path = ? 
        AND WorkspaceFileDependency.workspace = ?
        AND UserOrganization.user = ?;
        `, [filePath, workspaceGuid, params.user.guid]);
    
    let dependentComponents = dependentComponentsResult.map((row: any) => row.path);

    return { workspaceFile: { guid: workspaceFile.guid, updated: workspaceFile.updated }, dependentComponents, mtime: moment(workspaceFile.updated).valueOf() };
}, { useFormData: true });

async function updateRelatedComponents(workspaceFile: WorkspaceFile) {
    console.log("udpating related componetns for ", workspaceFile);
    if (workspaceFile.compiled) {
        let promises = [];
        let websitePageTemplates = await WebsitePageTemplate.fromQuery(`
SELECT * 
FROM WebsitePageTemplate
WHERE JSON_CONTAINS(content, JSON_OBJECT('component', JSON_OBJECT('guid', ?)), '$.blocks');`, [workspaceFile.guid]);
        console.log("matching pages length", websitePageTemplates.length)
        for (let websitePageTemplate of websitePageTemplates) {
            for (let block of websitePageTemplate.content.blocks) {
                if (block.component.guid === workspaceFile.guid) {
                    block.component.compiled = workspaceFile.compiled.toString('utf-8');
                    block.component.path = workspaceFile.path;
                }
            }
            promises.push(websitePageTemplate.save());
        }
        let results = await Promise.all(promises);
    }
    
}

async function saveDependenciesList(workspaceFileGuid: string, dependencies: string[], organizationGuid: string) {
    await db.query(`DELETE FROM WorkspaceFileDependency WHERE workspaceFile = ?`, [workspaceFileGuid]);
    // construct sql query
    let values = await Promise.all(dependencies.map(async dep => {
        let [_, workspaceGuid, path] = dep.match(/([^\/]+)(.*)/);
        return `(${mysql.escape(await createGuid())},${mysql.escape(workspaceFileGuid)}, ${mysql.escape(workspaceGuid)}, ${mysql.escape(path)}, ${mysql.escape(organizationGuid)})`
    }));
    if (values.length) {
        await db.query(`INSERT INTO WorkspaceFileDependency (guid, workspaceFile, workspace, path, organization) VALUES ${values.join(",")}`);
    }
}

// async function updateRelatedComponents(workspaceFile: WorkspaceFile, compiled: Buffer) {
//     if (compiled) {
//         let promises = [];
//         let websitePageTemplates = await WebsitePageTemplate.fromQuery(`
// SELECT * 
// FROM WebsitePageTemplate
// WHERE JSON_CONTAINS(content, JSON_OBJECT('component', JSON_OBJECT('guid', ?)), '$.blocks');`, [workspaceFile.guid]);
//         console.log("matching pages length", websitePageTemplates.length)
//         for (let websitePageTemplate of websitePageTemplates) {
//             for (let block of websitePageTemplate.content.blocks) {
//                 if (block.component.guid === workspaceFile.guid) {
//                     block.component.compiled = compiled;
//                     block.component.path = workspaceFile.path;
//                 }
//             }
//             promises.push(websitePageTemplate.save());
//         }
//         await Promise.all(promises);
//     }
// }