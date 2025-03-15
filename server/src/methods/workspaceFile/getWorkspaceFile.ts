import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default route(async function (params, workspaceGuid: string, guid: string) : Promise<WorkspaceFile> {
    let [item] = await db.query(`SELECT * 
        FROM WorkspaceFile 
        WHERE workspace = ? AND guid = ? AND organization = ?`,
        [workspaceGuid, guid, params.organization.guid]);
    if (!item) {
        throw new HttpError(400, "workspace file not found");
    }
    return item;
});