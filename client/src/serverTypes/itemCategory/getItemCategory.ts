import callMethod from "../../lib/callMethod";
import { ItemCategory } from "./ItemCategory.model";

export default function getItemCategory(guid: string) {
    return callMethod("itemCategory.getItemCategory", [...arguments]) as Promise<{ error?: string, data: ItemCategory[] }>;
};
