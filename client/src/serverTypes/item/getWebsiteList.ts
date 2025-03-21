import callMethod from "../../lib/callMethod";

export default function getWebsiteList(itemGuid: string, options?: { page: number, perPage: number }) {
    return callMethod("item.getWebsiteList", [...arguments]) as Promise<{ error?: string, data: { items: { name: string; websiteItem: string; website: string; }[]; } }>;
};
