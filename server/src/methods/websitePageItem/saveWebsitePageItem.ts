import { HttpError, route } from "../../lib/server";
import { WebsitePageItem } from "./WebsitePageItem.model";

export default route(async function (params, websitePageItemData: {
    guid?: string,
    websitePage?: string,
    item?: string,
}) {
    let websitePageItem: WebsitePageItem;
    if (websitePageItemData.guid) {
        [websitePageItem] = await WebsitePageItem.fetch(websitePageItemData.guid, params.organization.guid);
        Object.assign(websitePageItem, websitePageItemData)
    } else {
        if (!websitePageItemData.websitePage)
            throw new HttpError(400, "Website Page is required")
        if (!websitePageItemData.item)
            throw new HttpError(400, "Item is required")
        websitePageItem = new WebsitePageItem();
        websitePageItem.websitePage = websitePageItemData.websitePage;
        websitePageItem.item = websitePageItemData.item
    }
    websitePageItem.organization = params.organization.guid;
    await websitePageItem.save();
    return { websitePageItem };
});