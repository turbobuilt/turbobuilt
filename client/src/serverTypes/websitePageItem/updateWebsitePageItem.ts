import callMethod from "../../lib/callMethod";
import { WebsitePageItem } from "./WebsitePageItem.model";

export default function updateWebsitePageItem(websitePageItem: WebsitePageItem) {
    return callMethod("websitePageItem.updateWebsitePageItem", [...arguments]) as Promise<{ error?: string, data: { websitePageItem: WebsitePageItem; } }>;
};
