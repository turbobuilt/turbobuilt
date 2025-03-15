import db from "../../lib/db";
import { route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";

export default route(async function(params, guid, name: string) {
    await db.query(`UPDATE WorkspaceFile SET name = ? WHERE guid = ? AND organization = ?`, [name, guid, params.organization.guid]);
    return { success: true };
});