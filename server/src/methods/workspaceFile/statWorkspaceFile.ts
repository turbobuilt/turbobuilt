// import { FileStat } from "vscode";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import mysql from "mysql2";

enum FileType {
    File = 1,
    Directory = 2,
}
export interface FileStat {
    type: FileType;
    ctime: number;
    mtime: number;
    size: number;
}
export default route(async function (params, filePath: string) : Promise<FileStat> {
    console.log("filePath", filePath)
    let [_, workspaceGuid, path] = filePath.match(/\/([^\/]*)(.*)/);
    filePath = path || "/";
    console.log("the path is", filePath, workspaceGuid)
    let [item] = await WorkspaceFile.fromQuery(`SELECT WorkspaceFile.created, WorkspaceFile.updated, WorkspaceFile.guid, WorkspaceFile.type, LENGTH(WorkspaceFile.content) as size, WorkspaceFile.path
        FROM WorkspaceFile 
        JOIN UserOrganization ON UserOrganization.organization = WorkspaceFile.organization
        WHERE path = ?
        AND workspace = (SELECT Workspace.guid
            FROM Workspace 
            JOIN UserOrganization ON UserOrganization.organization = Workspace.organization
            WHERE UserOrganization.user = ? AND Workspace.guid = ?)
        AND UserOrganization.user = ?`,
        [filePath, params.user.guid, workspaceGuid, params.user.guid]
    ) as any as { created: Date, updated: Date, guid: string, type: string, size: number }[];
    
    if (!item) {
        return null;
    }

    return {
        ctime: new Date(item.created).getTime(),
        mtime: new Date(item.updated).getTime(),
        size: item.size,
        type: item.type === "file" ? FileType.File : FileType.Directory,
    } as FileStat;
});