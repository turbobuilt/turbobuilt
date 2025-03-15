import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, json, text, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { Website } from "../website/Website.model";
import { WorkspaceFile } from "../workspace/WorkspaceFile.model";
import { WebsitePageTemplateBlock } from "./WebsitePageTemplateBlock.model";
import { WebsitePageTemplateUrlSegment } from "./WebsitePageTemplateUrlSegment.model";

export class WebsitePageTemplate extends DbObject {
    @varchar(255)
    name: string;

    @foreign({ type: () => Website, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    website: string;

    @foreign({ type: () => Organization, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    organization: string;

    @json()
    defaultUrl?: WebsitePageTemplateUrlSegment[];

    @bit()
    addToAllSites?: boolean;

    @json()
    content = {
        blocks: [] as WebsitePageTemplateBlock[]
    }
}

