import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, options) {
    // let { page, perPage } = options || { page: 1, perPage: 1000 };

    let items = await db.query(`SELECT WebsitePageTemplate.*
        FROM WebsitePageTemplate
        WHERE WebsitePageTemplate.organization = ?
        `, [params.organization.guid]);

    return { items };
});