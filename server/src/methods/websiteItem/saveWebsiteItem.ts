import { HttpError, route } from "../../lib/server";
import { WebsiteItem } from "./WebsiteItem.model";

export default route(async function (params, websiteItemData: {
    guid?: string,
    website?: string,
    item?: string,
    url: string
}) {
    let websiteItem: WebsiteItem;
    if (websiteItemData.guid) {
        [websiteItem] = await WebsiteItem.fetch(websiteItemData.guid, params.organization.guid);
        Object.assign(websiteItem, websiteItemData)
    } else {
        if (!websiteItemData.website)
            throw new HttpError(400, "Website is required")
        if (!websiteItemData.item)
            throw new HttpError(400, "item is required")
        websiteItem = new WebsiteItem();
        websiteItem.website = websiteItemData.website;
        websiteItem.item = websiteItemData.item
    }
    websiteItem.organization = params.organization.guid;
    await websiteItem.save();
    return { websiteItem };
});

