import { WebsitePage } from "methods/websitePage/WebsitePage.model";
import db from "../../lib/db";
import { route } from "../../lib/server";
import { Item } from "./Item.model";
import { WebsitePageItem } from "methods/websitePageItem/WebsitePageItem.model";

export default route(async function (params, guid: string) {
    let [[item], [websitePage], [websitePageItem]] = await Promise.all([
        Item.fetch(guid, params.organization.guid),
        WebsitePage.fromQuery(`SELECT wp.*
            FROM WebsitePage wp
            JOIN WebsitePageItem wpi ON (wp.guid=wpi.websitePage AND wp.organization=?)
            WHERE wpi.item = ? AND wpi.organization = ?`, [params.organization.guid, guid, params.organization.guid]),
        WebsitePageItem.fromQuery(`SELECT * FROM WebsitePageItem WHERE item=? AND organization=?`, [guid, params.organization.guid])
    ]);
    return { item, websitePage, websitePageItem };
});