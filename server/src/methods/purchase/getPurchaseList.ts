import db from "../../lib/db";
import { route } from "../../lib/server";
import { Purchase } from "./Purchase.model";

export default route(async function (params, options = { page: 1, perPage: 500 }) {
    const page = Math.max(1, options.page);
    const perPage = Math.max(1, options.perPage);
    const offset = (page - 1) * perPage;

    let purchases = await Purchase.fromQuery(`SELECT Purchase.*
        FROM Purchase
        WHERE Purchase.organization = ?
        ORDER BY Purchase.created DESC
        LIMIT ? OFFSET ?`, 
        [params.organization.guid, perPage, offset]
    );

    
    // Get total count for pagination info
    const [{ total }] = await db.query(`
        SELECT COUNT(*) as total 
        FROM Purchase 
        WHERE Purchase.organization = ?`,
        [params.organization.guid]
    );

    return {
        purchases,
        pagination: {
            total,
            page,
            perPage,
            pages: Math.ceil(total / perPage)
        }
    };
});