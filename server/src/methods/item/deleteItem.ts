import { HttpError, route } from "lib/server";
import { Item } from "./Item.model";
import db from "lib/db";

export default route(async function (params, guid) {
    let [item] = await Item.fetch(guid, params.organization.guid);
    if (!item) {
        throw new HttpError(400, "That item doesn't exist within this organization. It may not even exist at all!");
    }
    await db.query(`DELETE FROM Item WHERE guid=? AND organization=?`, [guid, params.organization.guid]);
    return item;
})