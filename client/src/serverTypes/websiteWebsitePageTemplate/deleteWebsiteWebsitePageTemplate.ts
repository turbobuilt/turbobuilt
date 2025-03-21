import callMethod from "../../lib/callMethod";
import { WebsiteWebsitePageTemplate } from "./WebsiteWebsitePageTemplate.model";

export default function deleteWebsiteWebsitePageTemplate({
    websiteWebsitePageTemplateGuid,
    websiteGuid,
    websitePageTemplateGuid
}) {
    return callMethod("websiteWebsitePageTemplate.deleteWebsiteWebsitePageTemplate", [...arguments]) as Promise<{ error?: string, data: { websiteWebsitePageTemplate: import("/home/me/turbobuilt/server/src/methods/websiteWebsitePageTemplate/WebsiteWebsitePageTemplate.model").WebsiteWebsitePageTemplate; } }>;
};
