import callMethod from "../../lib/callMethod";
import { ItemCategory } from "./ItemCategory.model";

export default function saveItemCategory(itemCategory: ItemCategory) {
    return callMethod("itemCategory.saveItemCategory", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/itemCategory/ItemCategory.model").ItemCategory }>;
};
