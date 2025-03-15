import { HttpError, route } from "../../lib/server";
import { WebsiteWebsitePageTemplate } from "./WebsiteWebsitePageTemplate.model";

export default route(async function (params, websiteWebsitePageTemplateData: {
    guid?: string,
    website?: string,
    websitePageTemplate?: string,
    url: string
}) {
    let websiteWebsitePageTemplate: WebsiteWebsitePageTemplate;
    if (websiteWebsitePageTemplateData.guid) {
        [websiteWebsitePageTemplate] = await WebsiteWebsitePageTemplate.fetch(websiteWebsitePageTemplateData.guid, params.organization.guid);
        Object.assign(websiteWebsitePageTemplate, websiteWebsitePageTemplateData)
    } else {
        if (!websiteWebsitePageTemplateData.website)
            throw new HttpError(400, "Website is required")
        if (!websiteWebsitePageTemplateData.websitePageTemplate)
            throw new HttpError(400, "WebsitePageTemplate is required")
        websiteWebsitePageTemplate = new WebsiteWebsitePageTemplate();
        websiteWebsitePageTemplate.website = websiteWebsitePageTemplateData.website;
        websiteWebsitePageTemplate.websitePageTemplate = websiteWebsitePageTemplateData.websitePageTemplate
        websiteWebsitePageTemplate.url = websiteWebsitePageTemplateData.url;
    }
    websiteWebsitePageTemplate.organization = params.organization.guid;
    await websiteWebsitePageTemplate.save();
    return { websiteWebsitePageTemplate };
});