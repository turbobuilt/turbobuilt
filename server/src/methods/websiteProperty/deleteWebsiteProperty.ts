import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default route(async function (params, guid: string) {
    let [itemProperty] = await WebsiteProperty.fetch(guid, params.organization.guid);
    if (!itemProperty) {
        throw new HttpError(400, "That item property doesn't exist within this organization. It may not even exist at all!");
    }
    await db.query(`DELETE FROM WebsiteProperty WHERE guid=? AND organization=?`, [guid, params.organization.guid])
    return itemProperty;
});