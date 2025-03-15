import { WebsiteDomain } from "methods/websiteDomain/WebsiteDomain.model";
import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, text, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { Website } from "methods/website/Website.model";

export class DkimKey extends DbObject {
    @text()
    privateKey: string;

    @text()
    publicKey: string;

    @foreign({ type: () => Website, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    website: string;

    domain: string;
}