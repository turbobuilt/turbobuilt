import callMethod from "../../lib/callMethod";
import { ItemProperty } from "./ItemProperty.model";

export default function getItemPropertiesForItem(options: { page: number, perPage: number, websiteGuid?: string }, itemGuid: string) {
    return callMethod("itemProperty.getItemPropertiesForItem", [...arguments]) as Promise<{ error?: string, data: { itemProperties: (import("/home/me/turbobuilt/server/src/methods/itemProperty/ItemProperty.model").ItemProperty & { builtIn?: boolean; typeName?: string; })[]; } }>;
};
