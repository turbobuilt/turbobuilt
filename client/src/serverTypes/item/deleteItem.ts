import callMethod from "../../lib/callMethod";
import { Item } from "./Item.model";

export default function deleteItem(guid) {
    return callMethod("item.deleteItem", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/item/Item.model").Item }>;
};
