import { route } from "../../lib/server";
import { WebsitePageItem } from "./WebsitePageItem.model";

export default route(async function(params, websitePageItem: WebsitePageItem) {
    websitePageItem = await WebsitePageItem.init(websitePageItem, params.organization.guid);
    websitePageItem.organization = params.organization.guid;
    await websitePageItem.save();
    return { websitePageItem };
});