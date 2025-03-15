import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params) {
    let items = await db.query(`SELECT Organization.guid, Organization.name
        FROM Organization
        JOIN UserOrganization ON Organization.guid = UserOrganization.organization
        WHERE UserOrganization.user = ?
        ORDER BY Organization.name`, [params.user.guid]);

    return { items };
});