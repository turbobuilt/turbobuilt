import { HttpError, route } from "../../lib/server";
import { ItemCategory } from "./ItemCategory.model";

export default route(async function (params, itemCategory: ItemCategory) {
    let item = await ItemCategory.init(itemCategory, params.organization.guid);
    if (!item.name) {
        throw new HttpError(400, "name is required");
    } else if (!item.name) {
        throw new HttpError(400, "name is required");
    }

    try {
        item.organization = params.organization.guid;
        let result = await item.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "category with that identifier already exists");
        }
        throw err;
    }
    return item;
})