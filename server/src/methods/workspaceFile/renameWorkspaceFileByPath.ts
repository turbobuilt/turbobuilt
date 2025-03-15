import { Workspace } from "methods/workspace/Workspace.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import * as mysql from "mysql2";

export default route(async function (params, filePath: string, newFilePath: string) {
    let [_, workspaceGuid, path] = filePath.match(/\/([^\/]*)(.*)/);
    filePath = path || "/";
    let [__, newWorkspaceGuid, newPath] = newFilePath.match(/\/([^\/]*)(.*)/);

    let [[oldWorkspace], [newWorkspace]] = await Promise.all([
        Workspace.fromQuery(`SELECT Workspace.guid, Workspace.organization FROM Workspace JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
            WHERE Workspace.guid = ? AND UserOrganization.user = ?`, [workspaceGuid, params.user.guid]),
        Workspace.fromQuery(`SELECT Workspace.guid, Workspace.organization FROM Workspace JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
            WHERE Workspace.guid = ? AND UserOrganization.user = ?`, [newWorkspaceGuid, params.user.guid])
    ]);
    if (!oldWorkspace || !newWorkspace) {
        throw new HttpError(400, "workspace not found or you do not have access to it or this is a bug!");
    }

    // let files = await WorkspaceFile.fromQuery(`SELECT * FROM WorkspaceFile
    //     WHERE path LIKE ${mysql.escape(filePath + "%")}
    //     AND workspace = ${mysql.escape(workspaceGuid)}
    //     AND organization = ${mysql.escape(oldWorkspace.organization)}
    // `);

    await db.query(`
        UPDATE WorkspaceFile
        SET 
            path = CONCAT(${mysql.escape(newPath)}, SUBSTRING(path, ${filePath.length + 1})),
            workspace = ${mysql.escape(newWorkspaceGuid)},
            organization = ${mysql.escape(newWorkspace.organization)},
            pathParts = CONCAT('["', REPLACE(SUBSTR(path,2), '/', '","'), '"]')
        WHERE 
            path LIKE ${mysql.escape(filePath + "%")}
            AND workspace = ${mysql.escape(workspaceGuid)}
            AND organization = ${mysql.escape(oldWorkspace.organization)}
    `);
    
    await db.query(`DELETE FROM WorkspaceFileDependency
        WHERE (workspaceFile = (
            SELECT guid FROM WorkspaceFile
            WHERE path = ${mysql.escape(newPath)}
            AND workspace = ${mysql.escape(newWorkspaceGuid)}
            AND organization = ${mysql.escape(newWorkspace.organization)}
        )
        AND workspace = ${mysql.escape(workspaceGuid)})
        OR (
            path = ${mysql.escape(path)}
            AND workspace = ${mysql.escape(workspaceGuid)}
            AND organization = ${mysql.escape(oldWorkspace.organization)}
        )
    `);

    return { success: true };
});