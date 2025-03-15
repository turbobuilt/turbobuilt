import { DbObject } from "../../lib/DbObject.model";
import { foreign } from "../../lib/schema";

export class UserOrganization extends DbObject {
    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    user: string;
    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;
}