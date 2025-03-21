import callMethod from "../../lib/callMethod";
import { WebsiteWebsitePageTemplate } from "./WebsiteWebsitePageTemplate.model";

export default function updateWebsiteWebsitePageTemplate(websiteWebsitePageTemplate: WebsiteWebsitePageTemplate) {
    return callMethod("websiteWebsitePageTemplate.updateWebsiteWebsitePageTemplate", [...arguments]) as Promise<{ error?: string, data: { websiteWebsitePageTemplate: import("/home/me/turbobuilt/server/src/methods/websiteWebsitePageTemplate/WebsiteWebsitePageTemplate.model").WebsiteWebsitePageTemplate; } }>;
};
