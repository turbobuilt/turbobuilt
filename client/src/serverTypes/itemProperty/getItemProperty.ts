import callMethod from "../../lib/callMethod";
import { ItemProperty } from "./ItemProperty.model";

export default function getItemProperty(guid: string) {
    return callMethod("itemProperty.getItemProperty", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/itemProperty/ItemProperty.model").ItemProperty }>;
};
