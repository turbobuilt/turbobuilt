import db from "../../lib/db";
import { route } from "../../lib/server";
import { ItemPropertyType } from "./ItemPropertyType.model";

export default route(async function (params, guid: string) {
    let [itemPropertyType] = await ItemPropertyType.fetch(guid, params.organization.guid);
    return itemPropertyType;
    
});