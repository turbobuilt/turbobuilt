import db from "../../lib/db";
import { route } from "../../lib/server";
import { ItemCategory } from "./ItemCategory.model";

export default route(async function (params, guid: string) {
    let item = await ItemCategory.fetch(guid, params.organization.guid);
    return item;
});