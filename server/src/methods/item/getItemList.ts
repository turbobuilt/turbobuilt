import db from "../../lib/db";
import { route } from "../../lib/server";
import mysql from "mysql2";

export default route(async function (params, options: { page?: number, perPage?: number, websitePageIdentifier?: string }) {
    let { page, perPage, websitePageIdentifier } = options || { page: 1, perPage: 15 };

    let items = await db.query(`SELECT Item.*
        FROM Item
        ${  websitePageIdentifier ?
            "JOIN WebsitePageItem wpi ON (wpi.item=Item.guid AND wpi.organization=" + mysql.escape(params.organization.guid) + ")" +
            "JOIN WebsitePage wp ON (wp.guid=wpi.websitePage wp.identifier = " + mysql.escape(params.organization.guid) + ")"
            : ""
        }
        WHERE organization = ?
        ORDER BY name
        LIMIT ? OFFSET ?`, [params.organization.guid, perPage, (page - 1) * perPage]);

    return { items };
});