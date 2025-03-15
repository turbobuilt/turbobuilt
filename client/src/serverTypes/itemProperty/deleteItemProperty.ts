import callMethod from "../../lib/callMethod";
import { ItemProperty } from "./ItemProperty.model";

export default function deleteItemProperty(guid: string) {
    return callMethod("itemProperty.deleteItemProperty", [...arguments]) as Promise<{ error?: string, data: ItemProperty }>;
};
