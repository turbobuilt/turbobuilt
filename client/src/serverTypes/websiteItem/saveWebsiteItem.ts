import callMethod from "../../lib/callMethod";
import { WebsiteItem } from "./WebsiteItem.model";

export default function saveWebsiteItem(websiteItemData: {
    guid?: string,
    website?: string,
    item?: string,
    url: string
}) {
    return callMethod("websiteItem.saveWebsiteItem", [...arguments]) as Promise<{ error?: string, data: { websiteItem: import("/home/me/turbobuilt/server/src/methods/websiteItem/WebsiteItem.model").WebsiteItem; } }>;
};
