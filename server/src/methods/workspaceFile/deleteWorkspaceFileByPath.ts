import { Workspace } from "methods/workspace/Workspace.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import * as mysql from "mysql2";

export default route(async function (params, filePath: string) {
    let [_, workspaceGuid, path] = filePath.match(/\/([^\/]*)(.*)/);
    filePath = path || "/";
    let [workspaceFile] = await WorkspaceFile.fromQuery(`SELECT WorkspaceFile.guid, WorkspaceFile.type 
        FROM WorkspaceFile 
        JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
        WHERE path = ? 
        AND workspace = ?
        AND UserOrganization.user = ?`, [filePath, workspaceGuid, params.user.guid]);
    if (!workspaceFile) {
        throw new HttpError(400, `workspace file ${filePath} not found in workspace ...`);
    }
    if (workspaceFile?.type !== "file") {
        filePath = filePath + "%";
    }

    await db.query(`DELETE FROM WorkspaceFile
        WHERE path LIKE ?
        AND workspace = ?
        AND organization IN (
            SELECT organization
            FROM UserOrganization
            WHERE user = ?
        )`,
        [filePath, workspaceGuid, params.user.guid]);
    return { success: true };
});