import db from "../../lib/db";
import { route } from "../../lib/server";
import { WebsiteProperty } from "./WebsiteProperty.model";
import mysql from "mysql2";

export default route(async function (params, options: { page: number, perPage: number }, websiteGuid: string) {
    let { page, perPage } = options || { page: 1, perPage: 150 };
    let websiteProperties = await db.query(`SELECT WebsiteProperty.*
        FROM WebsiteProperty
        WHERE WebsiteProperty.organization = ? AND WebsiteProperty.website = ?
        ORDER BY name
        LIMIT ? OFFSET ?`, [params.organization.guid, websiteGuid, perPage, (page - 1) * perPage]) as WebsiteProperty[];
    return { websiteProperties };
});