import db from "../../lib/db";
import { route } from "../../lib/server";
import { Workspace } from "./Workspace.model";

export default route(async function (params) {
    let items = await db.query(`SELECT * FROM Workspace WHERE organization = ?`, [params.organization.guid]);
    return { items };
});