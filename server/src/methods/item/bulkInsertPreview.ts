import { WebsitePage } from "methods/websitePage/WebsitePage.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { Item } from "./Item.model";
import { WebsitePageItem } from "methods/websitePageItem/WebsitePageItem.model";

export default route(async function (params, rows: any[], headers: { text: string, itemPropertyType: string }[]) {
    if (rows.length > 150) {
        throw new HttpError(400, "Too many rows, max 150");
    }
    let criterion = [];
    for(let row of rows) {
        let ands = [];
        for(let header of headers) {
            let value = row[header.text];
            if (value) {
                ands.push(`ItemProperty.itemPropertyType=? AND ItemProperty.value=?`);
                criterion.push(header.itemPropertyType);
                criterion.push(value);
            }
        }
        if (ands.length) {
            criterion.push(`(${ands.join(" OR ")})`);
        }
    }
    let results = await db.query(`SELECT Item.*, JSON_OBJECTAGG(
            'itemPropertyType', ItemProperty.itemPropertyType,
            'value', ItemProperty.value
        ) AS properties
        FROM Item
        LEFT JOIN ItemProperty ON (Item.guid=ItemProperty.item)
        WHERE organization=?
        GROUP BY Item.guid
        HAVING 
        `, [params.organization.guid]);
    // let promises = [];
    // for (let row of rows) {
    //     let item = new Item();
    //     item.organization = params.organization.guid;
    //     for(let header of headers) {
    //         let value = row[header.text];
    //         if (value) {
    //             item[header.itemPropertyType] = value;
    //         }
    //     }
    //     promises.push(item.save());
    // }
});