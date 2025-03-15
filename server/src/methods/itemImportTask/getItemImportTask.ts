import { ItemImportTask } from "methods/itemImport/ItemImportTask.model";
import db from "../../lib/db";
import { route } from "../../lib/server";

export default route(async function (params, guid: string) {
    let [itemImportTask] = await ItemImportTask.fetch(guid, params.organization.guid);
    return itemImportTask;
});