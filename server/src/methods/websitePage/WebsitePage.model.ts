import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";

export class WebsitePage extends DbObject {
    @varchar(255)
    identifier: string;

    @foreign({ type: () => Organization, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    organization: string;
}