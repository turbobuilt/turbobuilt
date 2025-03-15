import callMethod from "../../lib/callMethod";
                     
export default function getItem(guid: string) {
    return callMethod("item.getItem", [...arguments]) as Promise<{ error?: string, data: { item: any; websitePage: any; websitePageItem: any; } }>;
};
