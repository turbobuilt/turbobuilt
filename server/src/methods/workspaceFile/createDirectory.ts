import { createGuid } from "lib/base58";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import moment from "moment";

export default route(async function (params, filePath: string) {
    let [_, workspaceGuid, path] = filePath.match(/\/([^\/]*)(.*)/);
    filePath = path || "/";
    let guid = createGuid();
    let now = new Date();
    let nowFormatted = moment(now).format("YYYY-MM-DD HH:mm:ss");
    let [workspace] = await db.query(`SELECT Workspace.guid, Workspace.organization
        FROM Workspace
        JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
        WHERE UserOrganization.user = ? AND Workspace.guid = ?`, [params.user.guid, workspaceGuid]);
    if (!workspace) {
        throw new HttpError(400, `workspace ${workspaceGuid} not found ...`);
    }

    await db.query(`INSERT INTO WorkspaceFile (guid, path, type, created, updated, workspace, organization)
        VALUES (?, ?, 'dir', ?, ?, (SELECT Workspace.guid
            FROM Workspace 
            JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
            WHERE UserOrganization.user = ? AND Workspace.guid = ?), ?)`,
        [guid, filePath, nowFormatted, nowFormatted, params.user.guid, workspaceGuid, workspace.organization]);
    return {
        guid,
        path: filePath,
        type: "dir",
        created: now,
        updated: now,
    }
});