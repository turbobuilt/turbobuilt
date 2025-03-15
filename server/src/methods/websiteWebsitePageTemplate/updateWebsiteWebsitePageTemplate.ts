import { route } from "../../lib/server";
import { WebsiteWebsitePageTemplate } from "./WebsiteWebsitePageTemplate.model";

export default route(async function(params, websiteWebsitePageTemplate: WebsiteWebsitePageTemplate) {
    websiteWebsitePageTemplate = await WebsiteWebsitePageTemplate.init(websiteWebsitePageTemplate, params.organization.guid);
    websiteWebsitePageTemplate.organization = params.organization.guid;
    await websiteWebsitePageTemplate.save();
    return { websiteWebsitePageTemplate };
});