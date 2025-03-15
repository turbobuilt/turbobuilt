import { HttpError, route } from "../../lib/server";
import { WebsitePage } from "./WebsitePage.model";

export default route(async function (params, clientItem: WebsitePage) {
    let websitePage = await WebsitePage.init(clientItem, params.organization.guid);
    if (!websitePage.identifier) {
        throw new HttpError(400, "identifier is required");
    }

    try {
        websitePage.organization = params.organization.guid;
        let result = await websitePage.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "website page with that identifier already exists");
        }
        throw err;
    }
    return websitePage;
})