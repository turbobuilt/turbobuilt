import callMethod from "../../lib/callMethod";
import { WebsitePageTemplate } from "./WebsitePageTemplate.model";

export default function getWebsitePageTemplate(guid: string) {
    return callMethod("websitePageTemplate.getWebsitePageTemplate", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/websitePageTemplate/WebsitePageTemplate.model").WebsitePageTemplate }>;
};
