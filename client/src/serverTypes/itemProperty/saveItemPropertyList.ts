import callMethod from "../../lib/callMethod";
import { ItemProperty } from "./ItemProperty.model";

export default function saveItemPropertyList(itemGuid: string, clientItemPropertyList: (ItemProperty & { builtIn?: boolean, typeName?: string })[], websiteGuid?: string) {
    return callMethod("itemProperty.saveItemPropertyList", [...arguments]) as Promise<{ error?: string, data: ItemProperty[] }>;
};
