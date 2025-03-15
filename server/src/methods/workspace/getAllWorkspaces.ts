import { route } from "lib/server";
import { Workspace } from "./Workspace.model";

export default route(async function(params) {
    let workspaces = await Workspace.fromQuery(`
        SELECT Workspace.guid, Organization.name as organizationName
        FROM Workspace
        JOIN Organization ON Organization.guid = Workspace.organization
        JOIN UserOrganization ON UserOrganization.organization = Organization.guid
        WHERE UserOrganization.user = ?
        GROUP BY Workspace.guid
    `, [params.user.guid]);
    return workspaces;
})