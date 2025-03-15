import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, options) {
    let { page, perPage } = options || { page: 1, perPage: 15 };
    let itemimages = await db.query(`SELECT * FROM ItemImage WHERE organization = ?
        ORDER BY name
        LIMIT ? OFFSET ?`, [params.organization.guid, perPage, (page - 1) * perPage]);

    return { itemimages };
});