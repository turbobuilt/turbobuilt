import callMethod from "../../lib/callMethod";
                     
export default function getWebsitePageTemplateListForSite(websiteGuid, options) {
    return callMethod("websitePageTemplate.getWebsitePageTemplateListForSite", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
