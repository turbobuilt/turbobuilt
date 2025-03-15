import callMethod from "../../lib/callMethod";
                     
export default function getItemPropertyList(options) {
    return callMethod("itemProperty.getItemPropertyList", [...arguments]) as Promise<{ error?: string, data: { itemProperties: any[]; } }>;
};
