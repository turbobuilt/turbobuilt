import callMethod from "../../lib/callMethod";
import { WebsitePageTemplate } from "./WebsitePageTemplate.model";

export default function saveWebsitePageTemplate(clientItem: WebsitePageTemplate) {
    return callMethod("websitePageTemplate.saveWebsitePageTemplate", [...arguments]) as Promise<{ error?: string, data: WebsitePageTemplate }>;
};
