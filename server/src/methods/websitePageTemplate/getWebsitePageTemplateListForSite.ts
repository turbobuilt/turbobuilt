import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, websiteGuid, options) {
    let { page, perPage } = options || { page: 1, perPage: 15 };

    let items = await db.query(`SELECT WebsitePageTemplate.*, WebsiteWebsitePageTemplate.url, WebsiteWebsitePageTemplate.guid as websiteWebsitePageTemplate
        FROM WebsitePageTemplate
        JOIN WebsiteWebsitePageTemplate ON (WebsitePageTemplate.guid = WebsiteWebsitePageTemplate.websitePageTemplate)
        WHERE WebsitePageTemplate.organization = ?
        AND WebsiteWebsitePageTemplate.website = ?
        ORDER BY name
        LIMIT ? OFFSET ?`, [params.organization.guid, websiteGuid, perPage, (page - 1) * perPage]);

    return { items };
});