import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, websitePageTemplateGuid, options) {
    let { page, perPage } = options || { page: 1, perPage: 15 };

    let items = await db.query(`SELECT Website.name, WebsiteWebsitePageTemplate.url, WebsiteWebsitePageTemplate.guid as websiteWebsitePageTemplate, Website.guid as website
        FROM Website
        LEFT JOIN WebsiteWebsitePageTemplate ON (Website.guid = WebsiteWebsitePageTemplate.website AND WebsiteWebsitePageTemplate.websitePageTemplate = ?)
        WHERE Website.organization = ?
        ORDER BY name
        LIMIT ? OFFSET ?`, [websitePageTemplateGuid, params.organization.guid, perPage, (page - 1) * perPage]) as {
        name: string;
        url: string;
        websiteWebsitePageTemplate: string;
        website: string;
    }[];

    return { items };
});