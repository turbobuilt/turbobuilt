import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, options) {
    let { page, perPage } = options || { page: 1, perPage: 15 };
    let itemProperties = await db.query(`SELECT * FROM WebsiteProperty WHERE organization = ?
        ORDER BY name
        LIMIT ? OFFSET ?`, [params.organization.guid, perPage, (page - 1) * perPage]);

    return { itemProperties };
});