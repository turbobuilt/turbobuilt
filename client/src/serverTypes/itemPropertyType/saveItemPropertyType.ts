import callMethod from "../../lib/callMethod";
import { ItemPropertyType } from "./ItemPropertyType.model";

export default function saveItemPropertyType(clientItemPropertyType: ItemPropertyType) {
    return callMethod("itemPropertyType.saveItemPropertyType", [...arguments]) as Promise<{ error?: string, data: ItemPropertyType }>;
};
