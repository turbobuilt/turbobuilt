import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, options) {
    let { page, perPage } = options || { page: 1, perPage: 15 };
    let itemImports = await db.query(`SELECT * FROM ItemImportTask WHERE organization = ?
        ORDER BY created DESC
        LIMIT ? OFFSET ?`, [params.organization.guid, perPage, (page - 1) * perPage]);

    return { items: itemImports };
});