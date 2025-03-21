import callMethod from "../../lib/callMethod";
import { WebsitePageTemplate } from "./WebsitePageTemplate.model";

export default function deleteWebsitePageTemplate(guid: string) {
    return callMethod("websitePageTemplate.deleteWebsitePageTemplate", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/websitePageTemplate/WebsitePageTemplate.model").WebsitePageTemplate }>;
};
