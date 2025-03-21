import callMethod from "../../lib/callMethod";
import { WebsiteItem } from "./WebsiteItem.model";

export default function updateWebsiteItem(websiteItem: WebsiteItem) {
    return callMethod("websiteItem.updateWebsiteItem", [...arguments]) as Promise<{ error?: string, data: { websiteItem: import("/home/me/turbobuilt/server/src/methods/websiteItem/WebsiteItem.model").WebsiteItem; } }>;
};
