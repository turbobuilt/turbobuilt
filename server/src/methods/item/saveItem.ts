import { HttpError, route } from "../../lib/server";
import { Item } from "./Item.model";

export default route(async function (params, clientItem: Item) {
    let item = await Item.init(clientItem, params.organization.guid);
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
            throw new HttpError(409, "workspace with that identifier already exists");
        }
        throw err;
    }
    return item;
})