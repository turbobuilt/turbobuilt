import db from "../../lib/db";
import { route } from "../../lib/server";
import { Workspace } from "./Workspace.model";
import { WorkspaceFile } from "./WorkspaceFile.model";

export default route(async function (params, guid: string) {
    let [workspace] = await Workspace.fetch(guid, params.organization.guid);
    return workspace;
});