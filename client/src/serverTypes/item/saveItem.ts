import callMethod from "../../lib/callMethod";
import { Item } from "./Item.model";

export default function saveItem(clientItem: Item) {
    return callMethod("item.saveItem", [...arguments]) as Promise<{ error?: string, data: Item }>;
};
