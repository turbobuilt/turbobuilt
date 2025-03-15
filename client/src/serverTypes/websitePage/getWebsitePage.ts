import callMethod from "../../lib/callMethod";
import { WebsitePage } from "./WebsitePage.model";

export default function getWebsitePage(guid: string) {
    return callMethod("websitePage.getWebsitePage", [...arguments]) as Promise<{ error?: string, data: WebsitePage }>;
};
