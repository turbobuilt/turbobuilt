import callMethod from "../../lib/callMethod";
import { WebsitePage } from "./WebsitePage.model";

export default function saveWebsitePage(clientItem: WebsitePage) {
    return callMethod("websitePage.saveWebsitePage", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/websitePage/WebsitePage.model").WebsitePage }>;
};
