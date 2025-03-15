import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WebsiteWebsitePageTemplate } from "./WebsiteWebsitePageTemplate.model";

export default route(async function (params, {
    websiteWebsitePageTemplateGuid,
    websiteGuid,
    websitePageTemplateGuid
}) {
    let websiteWebsitePageTemplate: WebsiteWebsitePageTemplate;
    if (websiteWebsitePageTemplateGuid) {
        console.log(websiteWebsitePageTemplateGuid);
        [websiteWebsitePageTemplate] = await WebsiteWebsitePageTemplate.fetch(websiteWebsitePageTemplateGuid, params.organization.guid)
    } else {
        [websiteWebsitePageTemplate] = await WebsiteWebsitePageTemplate.fromQuery(`SELECT *
            FROM WebsiteWebsitePageTemplate
            WHERE website = ?
                AND websitePageTemplate = ?
                AND organization = ?
            `, [websiteGuid, websitePageTemplateGuid, params.organization.guid]);
    }
    if (!websiteWebsitePageTemplate) {
        throw new HttpError(400, "That website website page wasn't found, or is not in your organization")
    }
    // await WebsiteWebsitePageTemplate.delete(websiteWebsitePageTemplate.guid);
    await db.query(`DELETE FROM WebsiteWebsitePageTemplate WHERE guid=? AND organization=?`, [websiteWebsitePageTemplate.guid, websiteWebsitePageTemplate.organization]);
    return { websiteWebsitePageTemplate }
});