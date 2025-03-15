import { Item } from "methods/item/Item.model";
import { HttpError, route } from "../../lib/server";
import { WebsiteProperty } from "./WebsiteProperty.model";
import { Website } from "methods/website/Website.model";

export default route(async function (params, clientWebsiteProperty: WebsiteProperty) {
    let websiteProperty = await WebsiteProperty.init(clientWebsiteProperty, params.organization.guid);
    if (!websiteProperty.website) {
        throw new HttpError(400, "website is required");
    }
    let [website] = await Website.fetch(websiteProperty.website, params.organization.guid);
    if (!website) {
        throw new HttpError(400, "That item wasn't found in the current organization")
    }

    try {
        websiteProperty.organization = params.organization.guid;
        let result = await websiteProperty.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, " with that identifier already exists");
        }
        throw err;
    }
    return websiteProperty;
})