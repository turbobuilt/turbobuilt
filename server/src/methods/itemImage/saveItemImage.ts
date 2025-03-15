import { HttpError, route } from "../../lib/server";
import { ItemImage } from "./ItemImage.model";

export default route(async function (params, clientItemImage: ItemImage) {
    let itemimage = await ItemImage.init(clientItemImage, params.organization.guid);
    if (!itemimage.item) {
        throw new HttpError(400, "item is required");
    }

    try {
        itemimage.organization = params.organization.guid;
        let result = await itemimage.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "workspace with that identifier already exists");
        }
        throw err;
    }
    return itemimage;
})