import callMethod from "../../lib/callMethod";
import { ItemPropertyType } from "./ItemPropertyType.model";

export default function deleteItemPropertyType(guid: string) {
    return callMethod("itemPropertyType.deleteItemPropertyType", [...arguments]) as Promise<{ error?: string, data: ItemPropertyType }>;
};
