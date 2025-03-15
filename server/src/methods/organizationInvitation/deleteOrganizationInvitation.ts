import { HttpError, route } from "lib/server";
import { OrganizationInvitation } from "./OrganizationInvitation.model";
import { UserOrganization } from "methods/userOrganization/UserOrganization.model";
import { randomBytes } from "crypto";
import db from "lib/db";

export default route(async function (params, organizationGuid: string, guid: string) {
    let [organizationInvitation] = await OrganizationInvitation.fetch(guid, organizationGuid);
    if (!organizationInvitation) {
        return new HttpError(400, 'Organization invitation not found');
    }
    let [organization] = await db.query(`SELECT Organization.*
        FROM Organization
        JOIN UserOrganization ON UserOrganization.organization = Organization.guid
        WHERE UserOrganization.user = ? AND Organization.guid = ?`, [params.user.guid, organizationGuid]);
    if (!organization) {
        return new HttpError(403, 'You do not have access to this organization');
    }
    await db.query(`DELETE FROM OrganizationInvitation WHERE guid = ? AND organization = ?`, [guid, organizationGuid]);
    return { success: true };    
});