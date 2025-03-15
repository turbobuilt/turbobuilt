import callMethod from "../../lib/callMethod";
import { ItemProperty } from "./ItemProperty.model";

export default function saveItemProperty(clientItemProperty: ItemProperty) {
    return callMethod("itemProperty.saveItemProperty", [...arguments]) as Promise<{ error?: string, data: ItemProperty }>;
};
