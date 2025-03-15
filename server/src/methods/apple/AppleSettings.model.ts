
import { DbObject } from "lib/DbObject.model";
import { bit, foreign, json, varchar } from "lib/schema";
import { Organization } from "methods/organization/Organization.model";

export class AppleSettings extends DbObject {
    @varchar(255)
    appleDomainAssociationFile: string;

    @foreign({ type: () => Organization, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    organization: string;
}