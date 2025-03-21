import callMethod from "../../lib/callMethod";

export default function getItemList(options: { page?: number, perPage?: number, websitePageIdentifier?: string }) {
    return callMethod("item.getItemList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
