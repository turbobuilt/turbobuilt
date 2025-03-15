import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, options: { page: number, perPage: number }) {
    let { page, perPage } = options || { page: 1, perPage: 15 };
    console.log("params.organization.guid", params.organization.guid);
    let items = await db.query(`SELECT * FROM Website WHERE organization = ?
        ORDER BY name
        LIMIT ? OFFSET ?`, [params.organization.guid, perPage, (page - 1) * perPage]);

    return { items };
});