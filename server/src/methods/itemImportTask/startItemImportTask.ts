import { WebsitePage } from "methods/websitePage/WebsitePage.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { WebsitePageItem } from "methods/websitePageItem/WebsitePageItem.model";
import { ItemProperty } from "methods/itemProperty/ItemProperty.model";
import { WebsiteItem } from "methods/websiteItem/WebsiteItem.model";
import { ItemImport } from "methods/itemImport/ItemImport.model";
import { Item } from "methods/item/Item.model";
import { ItemImportTask } from "methods/itemImport/ItemImportTask.model";
import { ItemImportBackup } from "methods/itemImport/ItemImportBackup.model";

export default route(async function (params, rows: any[], headers: { text: string, itemPropertyType: string }[], nameColumnIndex: number, selectedWebsite: string) {
    if (rows.length > 150) {
        throw new HttpError(400, "Too many rows, max 150");
    }
    if (headers.length > 50) {
        throw new HttpError(400, "Too many columns, max 50");
    }
    nameColumnIndex = parseInt(nameColumnIndex as any);
    if (isNaN(nameColumnIndex) || nameColumnIndex < 0 || nameColumnIndex >= headers.length) {
        throw new HttpError(400, "Invalid name column index");
    }
    let itemImportTask = new ItemImportTask();
    itemImportTask.organization = params.organization.guid;
    await itemImportTask.save();
    let promises = rows.map(async row => {
        let [item] = await Item.fromQuery(`SELECT * FROM Item WHERE name=? AND organization=?`, [row[headers[nameColumnIndex].text], params.organization.guid]);
        let existingItem = item ? JSON.parse(JSON.stringify(item)) : null;
        let isNew = false;
        if (!item) {
            item = new Item();
            isNew = true;
        } else {
            let itemProperties = await db.query(`SELECT * FROM ItemProperty WHERE item=? AND organization=?`, [item.guid, params.organization.guid]);
            await Promise.all(itemProperties.map(async itemProperty => {
                if (itemProperty.type === "Images") {
                    return;
                }
                let itemImportBackup = new ItemImportBackup();
                itemImportBackup.itemImport = itemImport.guid;
                itemImportBackup.tableName = "ItemProperty";
                itemImportBackup.data = itemProperty;
                itemImportBackup.organization = params.organization.guid;
                await itemImportBackup.save();
            }));
            await db.query(`DELETE FROM ItemProperty
                WHERE type NOT IN (SELECT guid FROM ItemPropertyType WHERE name='Images')
                AND item=?`, [item.guid]);
        }
        item.organization = params.organization.guid;
        item.name = row[headers[nameColumnIndex].text];
        await item.save();
        let itemImport = new ItemImport();
        itemImport.item = item.guid;
        itemImport.organization = params.organization.guid;
        itemImport.itemImportTask = itemImportTask.guid;
        await itemImport.save();

        if (existingItem) {
            let itemImportBackup = new ItemImportBackup();
            itemImportBackup.itemImport = itemImport.guid;
            itemImportBackup.tableName = "Item";
            itemImportBackup.data = existingItem;
            itemImportBackup.organization = params.organization.guid;
            await itemImportBackup.save();
        }

        for (let i = 0; i < headers.length; i++) {
            if (i === nameColumnIndex) {
                continue;
            }
            let header = headers[i];
            let value = row[header.text];
            if (value) {
                let itemProperty = new ItemProperty();
                itemProperty.item = item.guid;
                itemProperty.name = header.text;
                itemProperty.type = header.itemPropertyType;
                itemProperty.value = { value };
                itemProperty.organization = params.organization.guid;
                await itemProperty.save();
            }
        }
        if (isNew) {
            try {
                let websitePage = new WebsitePage();
                websitePage.organization = params.organization.guid;
                websitePage.identifier = convertNameToUrl(item.name);
                await websitePage.save();
                itemImport.websitePage = websitePage.guid;
                await itemImport.save();
                let websitePageItem = new WebsitePageItem();
                websitePageItem.websitePage = websitePage.guid;
                websitePageItem.item = item.guid;
                websitePageItem.organization = params.organization.guid;
                await websitePageItem.save();
                itemImport.websitePageItem = websitePageItem.guid;
                await itemImport.save();
                let websiteItem = new WebsiteItem();
                websiteItem.website = selectedWebsite;
                websiteItem.item = item.guid;
                websiteItem.organization = params.organization.guid;
                await websiteItem.save();
                itemImport.websiteItem = websiteItem.guid;
                await itemImport.save();
            } catch (err) {
                throw err;
                console.error("Error creating website page", err);
            }
        }
        return { guid: item.guid };
    });
    let results = await Promise.all(promises);
    itemImportTask.recordsCount = results.length;
    itemImportTask.completed = true;
    await itemImportTask.save();
    return { items: results, itemImportTask };
});

function convertNameToUrl(name: string) {
    name = name.replace(/\s+/g, " ");
    // convert myNameIsBob to my-name-is-bob
    name = name.replace(/([a-z])([A-Z])/g, "$1-$2");
    name = name.toLowerCase();
    name = name.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    return name;
}