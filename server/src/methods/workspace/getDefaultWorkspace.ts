import db from "../../lib/db";
import { route } from "../../lib/server";
import { Workspace } from "./Workspace.model";
import { WorkspaceFile } from "./WorkspaceFile.model";

export default route(async function (params) {
    let [workspace] = await Workspace.fromQuery(`
        SELECT * FROM Workspace
        WHERE organization = ?
        ORDER BY created ASC 
        LIMIT 1`, [params.organization.guid]);
    return { workspace };
});