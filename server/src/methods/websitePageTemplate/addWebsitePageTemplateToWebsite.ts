import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { Website } from "../website/Website.model";
import { WebsiteWebsitePageTemplate } from "../websiteWebsitePageTemplate/WebsiteWebsitePageTemplate.model";
import { WebsitePageTemplate } from "./WebsitePageTemplate.model";

export default route(async function (params, websiteGuid: string, websitePageTemplateGuid: string) {
    let [website] = await Website.fetch(websiteGuid, params.organization.guid);
    if (!website) {
        throw new HttpError(400, "website not found or you don't have access");
    }
    // if (!url) {
    //     throw new HttpError(400, "Please include a url. If this is a mistake, please contact support.")
    // }

    let [websitePageTemplate] = await WebsitePageTemplate.fetch(websitePageTemplateGuid, params.organization.guid);
    if (!websitePageTemplate) {
        throw new HttpError(400, "website page not found or you don't have access");
    }
    let websiteWebsitePageTemplate = new WebsiteWebsitePageTemplate();
    websiteWebsitePageTemplate.website = websiteGuid;
    websiteWebsitePageTemplate.websitePageTemplate = websitePageTemplateGuid;
    websiteWebsitePageTemplate.organization = params.organization.guid;
    // websiteWebsitePageTemplate.url = url;
    await websiteWebsitePageTemplate.save();

    return { success: true };
});