import { DbObject } from "../../lib/DbObject.model";
import { foreign, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { User } from "../user/models/User.model";

export class ItemPage extends DbObject {
    // @foreign({ type: () => Item, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    organization: string;
}