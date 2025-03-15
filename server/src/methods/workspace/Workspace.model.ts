import { DbObject } from "../../lib/DbObject.model";
import { foreign, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";

export class Workspace extends DbObject {
    @varchar(255)
    name: string;
    @varchar(255)
    identifier: string;

    @foreign({ type: () => Organization, onDelete: "set null", onUpdate: "set null", notNull: true })
    organization: string;
}