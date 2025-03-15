import callMethod from "../../lib/callMethod";
import { ItemPropertyType } from "./ItemPropertyType.model";

export default function getItemPropertyType(guid: string) {
    return callMethod("itemPropertyType.getItemPropertyType", [...arguments]) as Promise<{ error?: string, data: ItemPropertyType }>;
};
