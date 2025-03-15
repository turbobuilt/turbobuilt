import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, options: { page: number, perPage: number }) {
    let { page, perPage } = options || { page: 1, perPage: 15 };
    let items = await db.query(`SELECT * FROM WebsitePage WHERE organization = ?
        ORDER BY identifier
        LIMIT ? OFFSET ?`, [params.organization.guid, perPage, (page - 1) * perPage]);

    return { items };
});