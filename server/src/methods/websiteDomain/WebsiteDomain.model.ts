import { Website } from "methods/website/Website.model";
import { DbObject } from "../../lib/DbObject.model";
import { dateTime, foreign, text } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";

export class WebsiteDomain extends DbObject {
    @text()
    domain: string;

    @foreign({ type: () => Website, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    website: string;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    organization: string;
}