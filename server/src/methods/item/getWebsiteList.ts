import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, itemGuid: string, options?: { page: number, perPage: number }) {
    let { page, perPage } = options || { page: 1, perPage: 15 };

    let items = await db.query(`SELECT Website.name, WebsiteItem.guid as websiteItem, Website.guid as website
        FROM Website
        LEFT JOIN WebsiteItem ON (Website.guid = WebsiteItem.website AND WebsiteItem.item = ?)
        WHERE Website.organization = ?
        ORDER BY name
        LIMIT ? OFFSET ?`, [itemGuid, params.organization.guid, perPage, (page - 1) * perPage]) as {
        name: string;
        websiteItem: string;
        website: string;
    }[];

    return { items };
});