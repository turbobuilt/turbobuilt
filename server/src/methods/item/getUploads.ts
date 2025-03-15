import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, options: { page: number, perPage: number }) {
    let { page, perPage } = options || { page: 1, perPage: 15 };
    let items = await db.query(`SELECT Upload.*
        FROM Upload
        JOIN UploadItem
        WHERE organization = ?
        ORDER BY created DESC
        LIMIT ? OFFSET ?`, [params.organization.guid, perPage, (page - 1) * perPage]);

    return { items };
});