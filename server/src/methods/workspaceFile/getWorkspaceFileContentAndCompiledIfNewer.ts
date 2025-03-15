import { Workspace } from "methods/workspace/Workspace.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import * as mysql from "mysql2";
import moment from "moment";

export default route(async function (params, filePath: string, updated: string) : Promise<Uint8Array[]&{ exists: boolean, newContent?: boolean }> {
    let [_, workspaceGuid, path] = filePath.match(/\/([^\/]*)(.*)/);
    filePath = path || "/";
    if (!updated) {
        updated = '1000-01-01 00:00:00.000000';
    }
    let [item] = await db.query(`
        SELECT 
    wf.guid,
    wf.path,
    CASE 
        WHEN wf.updated > ${mysql.escape(updated)} THEN wf.content 
        ELSE NULL 
    END as content,
    CASE 
        WHEN wf.updated > ${mysql.escape(updated)} THEN wf.updated 
        ELSE NULL 
    END as updated,
    wf.compiled,
    CASE 
        WHEN wf.guid IS NOT NULL THEN true
        ELSE false
    END as file_exists,
    CASE
        WHEN wf.guid IS NOT NULL AND wf.updated > ${mysql.escape(updated)} THEN true
        ELSE false
    END as newContent
FROM (
    SELECT WorkspaceFile.guid 
    FROM WorkspaceFile 
    JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
    WHERE workspace = ${mysql.escape(workspaceGuid)}
    AND path = ${mysql.escape(filePath)}
    AND UserOrganization.user = ${mysql.escape(params.user.guid)}
) as lookup
LEFT JOIN WorkspaceFile wf ON wf.guid = lookup.guid;`);
    
    if (!item) {
        return { exists: false } as any;
    } else if (!item.newContent) {
        return { exists: true, newContent: false } as any;
    }

    // write to req
    item.content = item.content || Buffer.from([]);
    item.compiled = item.compiled || Buffer.from([]);
    
    console.log("writing head")
    let updatedBuffer = Buffer.from(moment(item.updated).format("YYYY-MM-DD HH:mm:ss.SSSSSS"));
    let combined = Buffer.concat([updatedBuffer, item.content, item.compiled]);
    params.res.writeHead(200, {
        "content-type": "application/octet-stream",
        "content-length": combined.length,
        "part-1-length": updatedBuffer.length,
        "part-2-length": item.content.length,
        "part-3-length": item.compiled.length,
    }).end(combined);
});