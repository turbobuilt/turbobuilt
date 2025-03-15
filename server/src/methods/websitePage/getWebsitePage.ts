import db from "../../lib/db";
import { route } from "../../lib/server";
import { WebsitePage } from "./WebsitePage.model";

export default route(async function (params, guid: string) {
    let [websitePage] = await WebsitePage.fetch(guid, params.organization.guid);
    return websitePage;
});