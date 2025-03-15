import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, searchText: string, { page, perPage, workspaceGuid }) {
    let items = await db.query(`SELECT *
        FROM WorkspaceFile
        WHERE organization = ? 
        AND workspace = ?
        AND type = 'file'
        ORDER BY name`, [params.organization.guid, workspaceGuid]);
    
    // let items = await db.query(`SELECT * FROM WorkspaceFile 
    //     WHERE organization = ? AND name LIKE ?
    //     AND workspace = ?
    //     ORDER BY name
    //     LIMIT ? OFFSET ?`, [params.organization.guid, `%${searchText}%`, workspaceGuid, perPage, (page - 1) * perPage]);

    return { items };
});