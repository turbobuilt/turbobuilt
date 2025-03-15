import callMethod from "../../lib/callMethod";
import { ItemPropertyType } from "./ItemPropertyType.model";

export default function getItemPropertyTypeList(options = { page: 1, perPage: 15, omitBuiltIn: false }) {
    return callMethod("itemPropertyType.getItemPropertyTypeList", [...arguments]) as Promise<{ error?: string, data: { itemPropertyTypes: ItemPropertyType[]; } }>;
};
