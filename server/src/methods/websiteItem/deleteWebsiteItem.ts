import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WebsiteItem } from "./WebsiteItem.model";

export default route(async function (params, {
    websiteItemGuid,
    websiteGuid,
    itemGuid
}) {
    let websiteItem: WebsiteItem;
    if (websiteItemGuid) {
        [websiteItem] = await WebsiteItem.fetch(websiteItemGuid, params.organization.guid)
    } else {
        [websiteItem] = await WebsiteItem.fromQuery(`SELECT *
            FROM WebsiteItem
            WHERE website = ?
                AND item = ?
                AND organization = ?
            `, [websiteGuid, itemGuid, params.organization.guid]);
    }
    if (!websiteItem) {
        throw new HttpError(400, "That website item wasn't found, or is not in your organization")
    }
    // await WebsiteItem.delete(websiteItem.guid);
    await db.query(`DELETE FROM WebsiteItem WHERE guid=? AND organization=?`, [websiteItem.guid, websiteItem.organization]);
    return { websiteItem }
});