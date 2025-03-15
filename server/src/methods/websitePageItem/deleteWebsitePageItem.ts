import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WebsitePageItem } from "./WebsitePageItem.model";

export default route(async function (params, {
    websiteWebsitePageTemplateGuid,
    websiteGuid,
    websitePageTemplateGuid
}) {
    let websiteWebsitePageTemplate: WebsitePageItem;
    if (websiteWebsitePageTemplateGuid) {
        console.log(websiteWebsitePageTemplateGuid);
        [websiteWebsitePageTemplate] = await WebsitePageItem.fetch(websiteWebsitePageTemplateGuid, params.organization.guid)
    } else {
        [websiteWebsitePageTemplate] = await WebsitePageItem.fromQuery(`SELECT *
            FROM WebsitePageItem
            WHERE website = ?
                AND websitePageTemplate = ?
                AND organization = ?
            `, [websiteGuid, websitePageTemplateGuid, params.organization.guid]);
    }
    if (!websiteWebsitePageTemplate) {
        throw new HttpError(400, "That website page item wasn't found, or is not in your organization")
    }
    // await WebsitePageItem.delete(websiteWebsitePageTemplate.guid);
    await db.query(`DELETE FROM WebsitePageItem WHERE guid=? AND organization=?`, [websiteWebsitePageTemplate.guid, websiteWebsitePageTemplate.organization]);
    return { websiteWebsitePageTemplate }
});