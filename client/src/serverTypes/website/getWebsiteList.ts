import callMethod from "../../lib/callMethod";

export default function getWebsiteList(options: { page: number, perPage: number }) {
    return callMethod("website.getWebsiteList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
