import { ServerParams } from "lib/node-server";
import { Website } from "methods/website/Website.model";
import { WorkspaceFile } from "methods/workspace/WorkspaceFile.model";
import { PageMatch, renderPage } from "./rendererServer";
import { RouteParameters } from "lib/server";
import db from "lib/db";
import mysql from "mysql2";

export async function renderComponentPreview(params: ServerParams) {
    let url = params.url
    console.log("url is sss", url);
    let [_, workspaceGuid, path] = url.pathname.match(/\/component-preview\/([^\/]+)(\/.+)/);
    console.log("workspaceGuid", workspaceGuid, "path", path);
    if (!workspaceGuid) {
        params.res.writeHead(400, { 'Content-Type': 'text/plain' });
        params.res.end('Missing workspace guid.');
        return;
    }

    let parts = path.split("/").slice(1);
    var conditions = [], queryParams = [];
    var workspaceFileQuery = `SELECT WorkspaceFile.*
        FROM WorkspaceFile
        WHERE `;
    for (let i = 0; i < 4 && i < parts.length; ++i) {
        let partIndex = i + 1;
        if (!parts[i] && i === parts.length - 1) {
            // look for index.*
            conditions.push(`WorkspaceFile.pathPart${partIndex} like 'index.%'`);
            continue;
        }
        conditions.push(`(WorkspaceFile.pathPart${partIndex} = ? OR WorkspaceFile.pathPart${partIndex} LIKE '[%')`);
        queryParams.push(parts[i]);
    }
    conditions.push(`(WorkspaceFile.type = 'file' OR WorkspaceFile.type IS NULL)`);
    conditions.push(`WorkspaceFile.workspace = ?`);
    conditions.push(`WorkspaceFile.organization IN (SELECT UserOrganization.organization FROM UserOrganization WHERE UserOrganization.user = (SELECT AuthToken.user FROM AuthToken WHERE AuthToken.token = ?))`);
    queryParams.push(workspaceGuid);
    // cookie authToken
    queryParams.push(params.req.headers["authorization"] || params.req.url?.match(/authToken=([^&]+)/)?.[1]);
    workspaceFileQuery += conditions.join(" AND ");
    var [workspaceFile] = await db.query(workspaceFileQuery, queryParams) as WorkspaceFile[];
    // console.log(mysql.format(workspaceFileQuery, queryParams));
    // console.log("GOT THJE FILE", workspaceFile);
    // if (!workspaceFile) {
    //     params.res.writeHead(400, { 'Content-Type': 'text/plain' });
    //     params.res.end(`Invalid component. workspace: ${workspaceGuid} path: ${path}`);
    //     return;
    // }
    if (workspaceFile?.path.endsWith(".html")) {
        params.res.writeHead(400, { 'Content-Type': 'text/html' });
        params.res.end(Buffer.from(workspaceFile.content));
        return;
    }
    var [workspaceFile] = await WorkspaceFile.fromQuery(`SELECT * FROM WorkspaceFile WHERE workspace = ? AND path = ?`, [workspaceGuid, path]);

    let website = await Website.init({ name: "Preview", domain: "preview", organization: workspaceFile.organization, activated: true });
    let match: PageMatch = {
        page: {
            name: workspaceFile.name,
            organization: workspaceFile.organization,
            website: website.guid,
            content: {
                blocks: [{
                    component: workspaceFile,
                    data: {}
                }]
            },
            url: null
        },
        variableValues: []
    }
    let page = await renderPage({ match, website, organization: workspaceFile.organization, authToken: params.req.headers["authorization"] || params.req.url?.match(/authToken=([^&]+)/)?.[1], preview: true });
    params.res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": page.length,
    });
    params.res.end(page);
}