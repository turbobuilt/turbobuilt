import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, guids: string[]) {
    if (!guids.length) {
        return { items: [] }
    }
    let items = await db.query(`SELECT *
        FROM Upload WHERE organization = ?
        AND guid IN (${guids.map(_ => "?").join(",")})
        ORDER BY created DESC
        `, [params.organization.guid, ...guids]);

    
    return { items };
});