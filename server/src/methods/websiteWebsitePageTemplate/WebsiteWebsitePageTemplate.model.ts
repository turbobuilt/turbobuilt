import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, json, text } from "../../lib/schema";

export class WebsiteWebsitePageTemplate extends DbObject {
    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    website: string;

    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    websitePageTemplate: string;

    @json()
    url: any;

    @bit()
    urlOverride?: boolean;

    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;
}