import callMethod from "../../lib/callMethod";
                     
export default function addWebsitePageTemplateToWebsite(websiteGuid: string, websitePageTemplateGuid: string) {
    return callMethod("websitePageTemplate.addWebsitePageTemplateToWebsite", [...arguments]) as Promise<{ error?: string, data: { success: boolean; } }>;
};
