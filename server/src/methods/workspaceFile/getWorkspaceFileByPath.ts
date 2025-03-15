import { Workspace } from "methods/workspace/Workspace.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import * as mysql from "mysql2";

export default route(async function (params, filePath: string) : Promise<ArrayBuffer> {
    let [_, workspaceGuid, path] = filePath.match(/\/([^\/]*)(.*)/);
    filePath = path || "/";
    
    let [item] = await db.query(`SELECT WorkspaceFile.guid, WorkspaceFile.path, WorkspaceFile.content
        FROM WorkspaceFile 
        JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
        WHERE workspace = ?
        AND path = ? AND UserOrganization.user = ?`,
        [workspaceGuid, filePath, params.user.guid]
    ) as WorkspaceFile[];
        
    if (!item) {
        return null;
    }
    // write to req
    console.log("writing head")
    params.res.writeHead(200, {
        "content-type": "application/octet-stream",
        "content-length": item.content.length,
    }).end(item.content);
});