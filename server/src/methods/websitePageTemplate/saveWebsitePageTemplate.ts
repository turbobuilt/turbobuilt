import { HttpError, route } from "../../lib/server";
import { WebsitePageTemplate } from "./WebsitePageTemplate.model";

export default route(async function (params, clientItem: WebsitePageTemplate) {
    let websitePageTemplate = await WebsitePageTemplate.init(clientItem, params.organization.guid);
    if (!websitePageTemplate.name) {
        throw new HttpError(400, "name is required");
    }

    try {
        websitePageTemplate.organization = params.organization.guid;
        let result = await websitePageTemplate.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "website page with that identifier already exists");
        }
        throw err;
    }
    return websitePageTemplate;
})