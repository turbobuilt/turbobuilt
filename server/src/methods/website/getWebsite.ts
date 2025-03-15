import { WebsiteDomain } from "methods/websiteDomain/WebsiteDomain.model";
import db from "../../lib/db";
import { route } from "../../lib/server";
import { Website } from "./Website.model";

export default route(async function (params, guid: string) {
    let [website] = await Website.fetch(guid, params.organization.guid);
    // website.domains = await WebsiteDomain.fromQuery(`SELECT * FROM WebsiteDomain WHERE website=? AND Organization=?`,[guid, params.organization.guid]);
    return website;
});