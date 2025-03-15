import { HttpError, route } from "../../lib/server";
import { ItemPropertyType } from "./ItemPropertyType.model";

export default route(async function (params, clientItemPropertyType: ItemPropertyType) {
    let itemPropertyType = await ItemPropertyType.init(clientItemPropertyType, params.organization.guid);

    try {
        itemPropertyType.organization = params.organization.guid;
        let result = await itemPropertyType.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "record with that identifier already exists");
        }
        throw err;
    }
    return itemPropertyType;
})