import callMethod from "../../lib/callMethod";
import { WebsiteWebsitePageTemplate } from "./WebsiteWebsitePageTemplate.model";

export default function saveWebsiteWebsitePageTemplate(websiteWebsitePageTemplateData: {
    guid?: string,
    website?: string,
    websitePageTemplate?: string,
    url: string
}) {
    return callMethod("websiteWebsitePageTemplate.saveWebsiteWebsitePageTemplate", [...arguments]) as Promise<{ error?: string, data: { websiteWebsitePageTemplate: WebsiteWebsitePageTemplate; } }>;
};
