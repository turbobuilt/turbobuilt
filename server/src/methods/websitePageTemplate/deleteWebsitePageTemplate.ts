import db from "../../lib/db";
import { route } from "../../lib/server";
import { WebsitePageTemplate } from "./WebsitePageTemplate.model";

export default route(async function (params, guid: string) {
    let [websitePageTemplate] = await WebsitePageTemplate.fetch(guid, params.organization.guid);
    await db.query(`DELETE FROM WebsitePageTemplate WHERE guid=? AND organization=?`,[guid, params.organization.guid]);
    return websitePageTemplate;
});