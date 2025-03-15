import { ItemProperty } from "methods/itemProperty/ItemProperty.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { ItemImport } from "methods/itemImport/ItemImport.model";
import { ItemImportBackup } from "methods/itemImport/ItemImportBackup.model";
import { Item } from "methods/item/Item.model";
import { ItemImportTask } from "methods/itemImport/ItemImportTask.model";

export default route(async function (params, guid: string) {
    let [itemImportTask] = await ItemImportTask.fromQuery(`SELECT * FROM ItemImportTask WHERE guid = ? AND organization = ?`, [guid, params.organization.guid]);
    if (!itemImportTask) {
        throw new HttpError(404, `Item import task with guid ${guid} not found`);
    }
    if (itemImportTask.rolledBack) {
        throw new HttpError(400, `Item import task with guid ${guid} already rolled back`);
    }
    let itemImports = await ItemImport.fromQuery(`SELECT * FROM ItemImport WHERE itemImportTask = ? AND organization = ?`, [itemImportTask.guid, params.organization.guid]);
    await Promise.all(itemImports.map(async itemImport => {
        if (itemImport.websiteItem) {
            await db.query(`DELETE FROM WebsiteItem WHERE guid=? AND organization=?`, [itemImport.websiteItem, params.organization.guid]);
        }
        if (itemImport.websitePage) {
            await db.query(`DELETE FROM WebsitePage WHERE guid=? AND organization=?`, [itemImport.websitePage, params.organization.guid]);
        }
        if (itemImport.websitePageItem) {
            await db.query(`DELETE FROM WebsitePageItem WHERE guid=? AND organization=?`, [itemImport.websitePageItem, params.organization.guid]);
        }
        if (itemImport.item) {
            let [backup] = await ItemImportBackup.fromQuery(`SELECT * FROM ItemImportBackup WHERE itemImport=? AND tableName='Item' AND organization=?`, [itemImport.guid, params.organization.guid]);
            if (!backup) {
                await db.query(`DELETE FROM Item WHERE guid=? AND organization=?`, [itemImport.item, params.organization.guid]);
            }
            await db.query(`DELETE FROM ItemProperty WHERE item=? AND organization=?`, [itemImport.item, params.organization.guid]);
        }

        let backups = await ItemImportBackup.fromQuery(`SELECT * FROM ItemImportBackup WHERE itemImport=? AND organization=?`, [itemImport.guid, params.organization.guid]);

        let tables = { ItemProperty, Item };
        await Promise.all(backups.map(async backup => {
            await db.query(`DELETE FROM ${backup.tableName} WHERE guid=? AND organization=?`, [backup.data.guid, params.organization.guid]);
            let obj = new tables[backup.tableName]();
            Object.assign(obj, backup.data);
            await obj.save();
        }));
    }));
    itemImportTask.rolledBack = true;
    await itemImportTask.save();
});