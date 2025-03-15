import callMethod from "../../lib/callMethod";
import { WebsiteItem } from "./WebsiteItem.model";

export default function deleteWebsiteItem({
    websiteItemGuid,
    websiteGuid,
    itemGuid
}) {
    return callMethod("websiteItem.deleteWebsiteItem", [...arguments]) as Promise<{ error?: string, data: { websiteItem: WebsiteItem; } }>;
};
