import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import mysql from "mysql2";
import { Item } from "./Item.model";

export interface Criteria { guids: string[], websitePageIdentifier?: string }
export interface Extra {
    orderBy?: [{ [key: string]: "asc" | "desc" }] | { [key: string]: "asc" | "desc" },
}

export default route(async function (params, criteria: Criteria, extra?: Extra) {
    let organizationGuid = params.website ? params.website.organization : params.organization.guid;
    let items = await getHydratedItems(organizationGuid, criteria, params.website?.guid, extra);
    return { items };
}, {
    public: true
});
export type HydratedItem = (Item&{ properties: any[], imageUrls: string[], description: string, basePrice: number, currency: string, currencySymbol: string });
export async function getHydratedItems(organizationGuid: string, criteria: Criteria, websiteGuid?: string, extra?: Extra) : Promise<any[]> {
    let fields = ["Item.*"];
    let args = [organizationGuid, organizationGuid, organizationGuid];
    let orderBySql = "";
    let guidsSql = "";

    if (criteria.guids) {
        if (!criteria.guids.length) {
            return [];
        }
        guidsSql += ` AND Item.guid IN (${criteria.guids.map(g => "?")}) `;
        args.push(...criteria.guids);
    }

    if (extra?.orderBy) {
        let orderByData = Array.isArray(extra.orderBy) ? extra.orderBy : [extra.orderBy];
        if (orderByData.length) {
            for (let order of orderByData) {
                if (typeof order !== "object") {
                    throw new HttpError(400, "Order must be an object like this: { colName: 'asc' OR 'desc' }")
                }
                let key = Object.keys(order)[0]
                let value = Object.values(order)[0];
                if (!key) {
                    throw new HttpError(400, "Key is missing. Order must be an object like this: { colName: 'asc' OR 'desc' }")
                }
                if (!value || !['asc', 'desc'].includes(value.toLowerCase())) {
                    throw new HttpError(400, "Value is missing. Order must be an object like this: { colName: 'asc' OR 'desc' }")
                }
                if (!orderBySql)
                    orderBySql = " ORDER BY ?? "
                else
                    orderBySql += ", ?? "
                args.push(key);
                orderBySql += value.toUpperCase();
            }
        }
    }

    let items = await db.query(`SELECT ${fields.join(", ")},
        COALESCE(ip.properties, JSON_ARRAY()) AS properties,
        COALESCE(wp.websitePages, JSON_ARRAY()) AS websitePages
        FROM Item
        LEFT JOIN (
            SELECT 
                ItemProperty.item,
                JSON_ARRAYAGG(JSON_OBJECT(
                    'name', ItemProperty.name,
                    'type', JSON_OBJECT('guid', ItemPropertyType.guid, 'name', ItemPropertyType.name),
                    'value', ItemProperty.value,
                    'systemUse', ItemProperty.systemUse,
                    'website', ItemProperty.website
                )) AS properties
            FROM ItemProperty
            LEFT JOIN ItemPropertyType ON (
                ItemProperty.type = ItemPropertyType.guid
                AND ItemPropertyType.organization = ?
            )
            WHERE ItemProperty.organization = ?
            GROUP BY ItemProperty.item
        ) ip ON Item.guid = ip.item
        LEFT JOIN (
            SELECT 
                WebsitePageItem.item,
                JSON_ARRAYAGG(JSON_OBJECT(
                    'identifier', WebsitePage.identifier
                )) AS websitePages
            FROM WebsitePageItem
            LEFT JOIN WebsitePage ON (WebsitePage.guid = WebsitePageItem.websitePage)
            GROUP BY WebsitePageItem.item
        ) wp ON Item.guid = wp.item
        ${criteria.websitePageIdentifier ?
            "JOIN WebsitePageItem wpi ON (wpi.item=Item.guid AND wpi.organization=" + mysql.escape(organizationGuid) + ")\n" +
            "JOIN WebsitePage wp ON (wp.guid=wpi.websitePage AND wp.identifier = " + mysql.escape(criteria.websitePageIdentifier) + ")\n"
            : ""
        }
        ${websiteGuid ? "LEFT JOIN WebsiteItem ON (WebsiteItem.item=Item.guid)" : ""}
        WHERE Item.organization = ?
        ${websiteGuid ?
            "AND (Item.addToAllSites = 1 OR WebsiteItem.website = " + mysql.escape(websiteGuid) + ")" : ""}
        ${guidsSql}
        GROUP BY Item.guid, ip.properties, wp.websitePages
        ${orderBySql}
        `, args) as HydratedItem[];

    // make it so it favors site specific props
    for (let item of items) {
        item.properties = Object.values(item.properties.reduce((acc, item) => {
            const itemName = item.name?.trim().toLowerCase();
            if (!acc[itemName] || (!acc[itemName].website && item.website)) {
                acc[itemName] = item;
            }
            return acc;
        }, {}));
        item.imageUrls = [];
        for (let property of item.properties) {
            if (!property?.systemUse) {
                console.log("not system use", property)
                continue;
            }
            if (property.name === "Images") {
                let urls = [];
                for (let valueItem of property?.value?.data) {
                    urls.push(`https://clientsites.dreamgenerator.ai/${valueItem.upload}/${valueItem.cloudStorageName}`)
                }
                item.imageUrls = item.imageUrls || [];
                item.imageUrls.push(...urls);
            } else if (property.name === "Description") {
                item.description = property.value.data;
            } else if (property.name === "PriceTable") {
                item.basePrice = property.value.data?.tiers?.[0]?.price;
                item.currency = property.value.data?.currency;
                item.currencySymbol = property.value.data?.symbol;
            }
        }
    }
    return items;
}

export async function hydrateCart(organizationGuid: string, cart: any) {
    let guids = cart.lineItems.map((li: any) => li.item.guid);
    let items = await getHydratedItems(organizationGuid, { guids });
    let itemMap = items.reduce((acc, item) => {
        acc[item.guid] = item;
        return acc;
    }, {});
    for (let lineItem of cart.lineItems) {
        lineItem.item = itemMap[lineItem.item.guid];
    }
    return cart;
}