import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { Workspace } from "./Workspace.model";
import { WorkspaceFile } from "./WorkspaceFile.model";

export default route(async function (params, guid: string) {
    let [workspace] = await Workspace.fetch(guid, params.organization.guid);
    if (!workspace) {
        throw new HttpError(400, `Workspace ${guid} wasn't found in this organization.`)
    }
    await db.query(`DELETE FROM Workspace WHERE guid=?`, [workspace.guid])
    return workspace;
});