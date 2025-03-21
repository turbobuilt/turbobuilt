import callMethod from "../../lib/callMethod";

export default function getWebsitePageList(options: { page: number, perPage: number }) {
    return callMethod("websitePage.getWebsitePageList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
