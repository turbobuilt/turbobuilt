import { HttpError, route } from "lib/server";
import { OrganizationInvitation } from "./OrganizationInvitation.model";
import { UserOrganization } from "methods/userOrganization/UserOrganization.model";
import db from "lib/db";

export default route(async function (params, token: string) {
    if (!token) {
        throw new HttpError(400, 'Token is required');
    }
    let [organizationInvitation] = await OrganizationInvitation.fromQuery(`SELECT OrganizationInvitation.*
        FROM OrganizationInvitation
        WHERE OrganizationInvitation.token = ?`, [token]);
    if (!organizationInvitation) {
        throw new HttpError(400, 'Invitation not found');
    }
    await db.query(`DELETE FROM OrganizationInvitation WHERE guid=?`, [organizationInvitation.guid]);
    return { success: true };
});