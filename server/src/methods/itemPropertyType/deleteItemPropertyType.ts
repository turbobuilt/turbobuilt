import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { ItemPropertyType } from "./ItemPropertyType.model";

export default route(async function (params, guid: string) {
    let [itemPropertyType] = await ItemPropertyType.fetch(guid, params.organization.guid);
    if (!itemPropertyType) {
        throw new HttpError(400, "That item property doesn't exist within this organization. It may not even exist at all!");
    }
    await db.query(`DELETE FROM ItemPropertyType WHERE guid=? AND organization=?`, [guid, params.organization.guid])
    return itemPropertyType;
});