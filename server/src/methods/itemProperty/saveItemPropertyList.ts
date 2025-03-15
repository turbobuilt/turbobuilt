import { builtIns, ensureBuiltInItemPropertyTypesForOrganization } from "methods/itemPropertyType/getItemPropertyTypeList";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { Item } from "../item/Item.model";
import { ItemProperty } from "./ItemProperty.model";
import mysql from "mysql2"


export default route(async function (params, itemGuid: string, clientItemPropertyList: (ItemProperty & { builtIn?: boolean, typeName?: string })[], websiteGuid?: string) {
    await ensureBuiltInItemPropertyTypesForOrganization(params.organization.guid, db);
    
    let itemPropertyList = await Promise.all(clientItemPropertyList.map(item => ItemProperty.init(item, params.organization.guid)));
    for (let i = 0; i < itemPropertyList.length; ++i) {
        if (itemPropertyList[i].item !== itemGuid) {
            throw new HttpError(500, `Item ${i + 1} doesn't have a matching 'item'. This is probably a bug in the system and should be reported to support!`);
        }
        itemPropertyList[i].organization = params.organization.guid;
        if (typeof itemPropertyList[i].value === "string" || typeof itemPropertyList[i].value === "number")
            itemPropertyList[i].value = JSON.stringify(itemPropertyList[i].value)
    }
    let [item] = await Item.fetch(itemGuid, params.organization.guid);
    if (!item) {
        throw new HttpError(403, `The item was not found, or does not belong to your current organization.`);
    }
    
    await Promise.all(itemPropertyList.map(async itemProperty => {
        if (!itemProperty.type && itemProperty.builtIn) {
            let [match] = await db.query(`SELECT guid FROM ItemPropertyType WHERE builtIn = ? AND name = ? AND builtIn = 1 AND organization = ?`, [1, itemProperty.typeName, params.organization.guid]);
            if (!match) {
                throw new HttpError(400, `The item property type ${itemProperty.typeName} is a built-in type, but it was not found in the current organization.`);
            }
            itemProperty.type = match.guid;
        }
    }));

    await db.transaction(async (con) => {
        let guids = itemPropertyList.map(item => item.guid);
        let q = guids.length ? `AND guid NOT IN (${guids.map(_ => "?").join(",")})` : '';
        await con.query(`DELETE FROM ItemProperty 
            WHERE item=? 
                AND organization=? 
                AND ItemProperty.website ${websiteGuid ? "=" + mysql.escape(websiteGuid) : "IS NULL" }
            ${q}`, [item.guid, params.organization.guid, ...guids]);
        await Promise.all(itemPropertyList.map(itemProperty => itemProperty.save()));
    });
    return itemPropertyList;
})