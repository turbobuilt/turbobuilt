import db from "lib/db";
import { route } from "lib/server";
import { WorkspaceFile } from "methods/workspace/WorkspaceFile.model";
import * as mysql from "mysql2";

export default route(async function (params, filePath) {
    let [_, workspaceGuid, path] = filePath.match(/\/([^\/]*)(.*)/);
    filePath = path || "/";
    filePath = filePath.replace(/%/g, "\\%")
    console.log("workspaceGuid", workspaceGuid)
    
    if (filePath === "/") { 
        let items = await db.query(`SELECT WorkspaceFile.path, WorkspaceFile.type
            FROM WorkspaceFile 
            JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
            WHERE path LIKE '/%' AND path NOT LIKE '/%/' AND path NOT LIKE '/%/%' AND path <> '/'
            AND UserOrganization.user = ?
            AND workspace = ?
            ORDER BY path ASC`,
            [params.user.guid, workspaceGuid]
        ) as WorkspaceFile[];
        return { items };
    }

    let items = await db.query(`SELECT path, type
        FROM WorkspaceFile 
        JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
        WHERE (path LIKE ? AND path NOT LIKE ? AND path NOT LIKE ? AND PATH <> ?)
        AND workspace = ?
        AND UserOrganization.user = ?
        ORDER BY path ASC`,
        [`${filePath}/%`, `${filePath}/%/`, `${filePath}/%/%`, filePath, workspaceGuid, params.user.guid]
    ) as WorkspaceFile[];
        
    console.log("items", items);
    return { items };
});