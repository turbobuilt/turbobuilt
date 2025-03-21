import callMethod from "../../lib/callMethod";
import { WebsitePageItem } from "./WebsitePageItem.model";

export default function deleteWebsitePageItem({
    websiteWebsitePageTemplateGuid,
    websiteGuid,
    websitePageTemplateGuid
}) {
    return callMethod("websitePageItem.deleteWebsitePageItem", [...arguments]) as Promise<{ error?: string, data: { websiteWebsitePageTemplate: import("/home/me/turbobuilt/server/src/methods/websitePageItem/WebsitePageItem.model").WebsitePageItem; } }>;
};
