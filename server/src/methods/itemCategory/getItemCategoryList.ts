import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params) {
    let items = await db.query(`SELECT * FROM ItemCategory WHERE organization = ?`, [params.organization.guid]);
    return { items };
});