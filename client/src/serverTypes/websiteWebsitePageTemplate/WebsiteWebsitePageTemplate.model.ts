import { DbObject } from "../DbObject.model";

export class WebsiteWebsitePageTemplate extends DbObject {
    website: string;
    websitePageTemplate: string;
    url: any;
    urlOverride?: boolean;
    organization: string;
}
