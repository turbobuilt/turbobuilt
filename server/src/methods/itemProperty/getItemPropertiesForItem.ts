import db from "../../lib/db";
import { route } from "../../lib/server";
import { ItemProperty } from "./ItemProperty.model";
import mysql from "mysql2";

export default route(async function (params, options: { page: number, perPage: number, websiteGuid?: string }, itemGuid: string) {
    let { page, perPage } = options || { page: 1, perPage: 150 };
    let itemProperties = await db.query(`SELECT ItemProperty.*, ItemPropertyType.builtIn, ItemPropertyType.name AS typeName
        FROM ItemProperty
        JOIN ItemPropertyType ON ItemProperty.type = ItemPropertyType.guid
        LEFT JOIN WebsiteItem ON (ItemProperty.website = WebsiteItem.website AND ItemProperty.item = WebsiteItem.item)
        WHERE ItemProperty.organization = ? AND ItemProperty.item = ?
        ${ options.websiteGuid == null ?
            "AND ItemProperty.website IS NULL" : 
            "AND ItemProperty.website = " + mysql.escape(options.websiteGuid)
        }
        ORDER BY name
        LIMIT ? OFFSET ?`, [params.organization.guid, itemGuid, perPage, (page - 1) * perPage]) as (ItemProperty & { builtIn?: boolean, typeName?: string })[];
    return { itemProperties };
});