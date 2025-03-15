import { Item } from "methods/item/Item.model";
import { HttpError, route } from "../../lib/server";
import { ItemProperty } from "./ItemProperty.model";
import { Website } from "methods/website/Website.model";

export default route(async function (params, clientItemProperty: ItemProperty) {
    let itemProperty = await ItemProperty.init(clientItemProperty, params.organization.guid);
    if (itemProperty.item) {
        let [item] = await Item.fetch(itemProperty.item, params.organization.guid);
        if (!item) {
            throw new HttpError(400, "That item wasn't found in the current organization")
        }
    } else if (itemProperty.website) {
        let [website] = await Website.fetch(itemProperty.website, params.organization.guid);
        if (!website) {
            throw new HttpError(400, "That website wasn't found in the current organization")
        }
    }

    try {
        itemProperty.organization = params.organization.guid;
        let result = await itemProperty.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, " with that identifier already exists");
        }
        throw err;
    }
    return itemProperty;
})