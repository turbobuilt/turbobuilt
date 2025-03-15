import callMethod from "../../lib/callMethod";
import { WebsitePageTemplate } from "./WebsitePageTemplate.model";

export default function getWebsitePageTemplate(guid: string) {
    return callMethod("websitePageTemplate.getWebsitePageTemplate", [...arguments]) as Promise<{ error?: string, data: WebsitePageTemplate }>;
};
