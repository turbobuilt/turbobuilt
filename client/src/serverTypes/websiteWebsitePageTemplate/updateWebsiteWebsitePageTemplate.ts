import callMethod from "../../lib/callMethod";
import { WebsiteWebsitePageTemplate } from "./WebsiteWebsitePageTemplate.model";

export default function updateWebsiteWebsitePageTemplate(websiteWebsitePageTemplate: WebsiteWebsitePageTemplate) {
    return callMethod("websiteWebsitePageTemplate.updateWebsiteWebsitePageTemplate", [...arguments]) as Promise<{ error?: string, data: { websiteWebsitePageTemplate: WebsiteWebsitePageTemplate; } }>;
};
