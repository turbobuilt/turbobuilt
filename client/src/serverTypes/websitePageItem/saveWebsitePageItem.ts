import callMethod from "../../lib/callMethod";
import { WebsitePageItem } from "./WebsitePageItem.model";

export default function saveWebsitePageItem(websitePageItemData: {
    guid?: string,
    websitePage?: string,
    item?: string,
}) {
    return callMethod("websitePageItem.saveWebsitePageItem", [...arguments]) as Promise<{ error?: string, data: { websitePageItem: WebsitePageItem; } }>;
};
