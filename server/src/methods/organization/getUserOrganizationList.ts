import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, organizationGuid: string) {
    let items = await db.query(`SELECT UserOrganization.guid as userOrganization, User.*
        FROM UserOrganization
        JOIN User ON User.guid = UserOrganization.user
        WHERE UserOrganization.organization = (
            SELECT Organization.guid
            FROM Organization
            JOIN UserOrganization ON UserOrganization.organization = Organization.guid
            WHERE UserOrganization.user = ? AND Organization.guid = ?
        )
        `, [params.user.guid, organizationGuid]);
    
    return { items };
});