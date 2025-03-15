import { WebsitePageTemplate } from "methods/websitePageTemplate/WebsitePageTemplate.model";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import { Workspace } from "methods/workspace/Workspace.model";
import mysql from "mysql2";

export default route(async function (params, workspaceFile: WorkspaceFile, compiled: { js: string, css: string, path: string }) {
    let organizationGuid = null;
    if (workspaceFile.guid) {
        let [existing] = await WorkspaceFile.fromQuery(`SELECT WorkspaceFile.*
            FROM WorkspaceFile
            JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
            WHERE guid = ? AND UserOrganization.user = ?`, [workspaceFile.guid, params.user.guid]);
        if (!existing) {
            throw new HttpError(400, `WorkspacecFile with guid "${workspaceFile.guid}" not found in this organization.`)
        }
        organizationGuid = existing.organization;
    } else {
        let [workspace] = await Workspace.fromQuery(`SELECT Workspace.guid, Workspace.organization
            FROM Workspace
            JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
            WHERE guid = ? AND UserOrganization.user = ?`, [workspaceFile.workspace, params.user.guid]);
        if (!workspace) {
            throw new HttpError(400, `Workspace with guid "${workspaceFile.workspace}" not found in this organization.`)
        }
        organizationGuid = workspace.organization;
    }
    workspaceFile = await WorkspaceFile.init(workspaceFile, organizationGuid);
    workspaceFile.organization = organizationGuid;
    workspaceFile.pathParts = workspaceFile.path?.split("/").slice(1) 
    await workspaceFile.save();

    await updateRelatedComponents(workspaceFile, params.user.guid, compiled);

    return { workspaceFile };
});

async function updateRelatedComponents(workspaceFile: WorkspaceFile, userGuid, compiled: { js: string, css: string, path: string }) {
    if (compiled.js !== null && compiled.css !== null) {
        let promises = [];
        let websitePageTemplates = await WebsitePageTemplate.fromQuery(`
SELECT WebsitePageTemplate.* 
FROM WebsitePageTemplate
JOIN UserOrganization ON UserOrganization.organization = WebsitePageTemplate.organization
WHERE UserOrganization.user = ${mysql.escape(userGuid)} AND
JSON_CONTAINS(content, JSON_OBJECT('component', JSON_OBJECT('guid', ?)), '$.blocks');`, [workspaceFile.guid]);
        console.log("matching pages length", websitePageTemplates.length)
        for (let websitePageTemplate of websitePageTemplates) {
            for (let block of websitePageTemplate.content.blocks) {
                if (block.component.guid === workspaceFile.guid) {
                    block.component.compiledCss = compiled.css;
                    block.component.compiledJs = compiled.js;
                    block.component.path = compiled.path;
                }
            }
            promises.push(websitePageTemplate.save());
        }
        await Promise.all(promises);
    }
}