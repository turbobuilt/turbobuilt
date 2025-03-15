import { route } from "../../lib/server";
import { WebsiteItem } from "./WebsiteItem.model";

export default route(async function(params, websiteItem: WebsiteItem) {
    websiteItem = await WebsiteItem.init(websiteItem, params.organization.guid);
    websiteItem.organization = params.organization.guid;
    await websiteItem.save();
    return { websiteItem };
});