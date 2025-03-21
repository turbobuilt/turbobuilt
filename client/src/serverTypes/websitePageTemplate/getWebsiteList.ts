import callMethod from "../../lib/callMethod";

export default function getWebsiteList(websitePageTemplateGuid, options) {
    return callMethod("websitePageTemplate.getWebsiteList", [...arguments]) as Promise<{ error?: string, data: { items: { name: string; url: string; websiteWebsitePageTemplate: string; website: string; }[]; } }>;
};
