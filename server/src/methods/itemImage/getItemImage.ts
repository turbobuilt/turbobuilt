import db from "../../lib/db";
import { route } from "../../lib/server";
import { ItemImage } from "./ItemImage.model";

export default route(async function (params, guid: string) {
    let [itemImage] = await ItemImage.fetch(guid, params.organization.guid);
    return itemImage;
});