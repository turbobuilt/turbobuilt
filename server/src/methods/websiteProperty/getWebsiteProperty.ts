import db from "../../lib/db";
import { route } from "../../lib/server";
import { WebsiteProperty } from "./WebsiteProperty.model";

export default route(async function (params, guid: string) {
    let [itemProperty] = await WebsiteProperty.fetch(guid, params.organization.guid);
    return itemProperty;
});