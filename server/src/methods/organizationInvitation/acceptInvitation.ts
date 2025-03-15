import { HttpError, route } from "lib/server";
import { OrganizationInvitation } from "./OrganizationInvitation.model";
import { UserOrganization } from "methods/userOrganization/UserOrganization.model";

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
    let userOrganization = await UserOrganization.init({
        user: params.user.guid,
        organization: organizationInvitation.organization
    });
    await userOrganization.save();
    await organizationInvitation.delete();
    return userOrganization;
});