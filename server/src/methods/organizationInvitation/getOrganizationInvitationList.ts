import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, organizationGuid: string) {    
    console.log("organizationGuid", organizationGuid);
    let items = await db.query(`
        SELECT OrganizationInvitation.*
        FROM OrganizationInvitation
        WHERE OrganizationInvitation.organization = (SELECT Organization.guid
            FROM Organization
            JOIN UserOrganization ON UserOrganization.organization = Organization.guid
            WHERE UserOrganization.user = ? AND Organization.guid = ?
        )`, [params.user.guid, organizationGuid]);

    return { items };
});