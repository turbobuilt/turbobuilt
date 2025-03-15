import db from "lib/db";
import { HttpError, route } from "../../lib/server";
import { Workspace } from "./Workspace.model";
import { WorkspaceFile } from "./WorkspaceFile.model";

export default route(async function (params, clientWorkspace: Workspace) {
    let workspace = await Workspace.init(clientWorkspace, params.organization.guid);
    if (!workspace.identifier) {
        throw new HttpError(400, "identifier is required");
    } else if (!workspace.name) {
        throw new HttpError(400, "name is required");
    }
    let isNew = !workspace.guid;

    try {
        workspace.organization = params.organization.guid;
        let result = await workspace.save();
        if (isNew) {
            let defaultFiles = await db.query(`SELECT * FROM WorkspaceFile WHERE workspace = ?`, [process.env.sample_workspace_guid]);
            await Promise.all(defaultFiles.map(async file => {
                let newFile = new WorkspaceFile();
                Object.assign(newFile, file);
                newFile.workspace = workspace.guid;
                newFile.organization = params.organization.guid;
                await newFile.save();
            }));
        }
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "workspace with that identifier already exists");
        }
        throw err;
    }
    return workspace;
})