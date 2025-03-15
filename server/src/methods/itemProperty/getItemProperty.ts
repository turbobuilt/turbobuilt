import db from "../../lib/db";
import { route } from "../../lib/server";
import { ItemProperty } from "./ItemProperty.model";

export default route(async function (params, guid: string) {
    let [itemProperty] = await ItemProperty.fetch(guid, params.organization.guid);
    return itemProperty;
});