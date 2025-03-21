import { DbObject } from "../DbObject.model";
import { WebsitePageTemplateUrlSegment } from "./WebsitePageTemplateUrlSegment.model";

export class WebsitePageTemplate extends DbObject {
    name: string;
    website: string;
    organization: string;
    defaultUrl?: WebsitePageTemplateUrlSegment;
    addToAllSites?: boolean;
    content: { blocks: WebsitePageTemplateBlock[]; } = {
                blocks: [] as WebsitePageTemplateBlock[]
            };
}
