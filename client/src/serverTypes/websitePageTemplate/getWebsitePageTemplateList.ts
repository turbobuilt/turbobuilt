import callMethod from "../../lib/callMethod";

export default function getWebsitePageTemplateList(options) {
    return callMethod("websitePageTemplate.getWebsitePageTemplateList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
