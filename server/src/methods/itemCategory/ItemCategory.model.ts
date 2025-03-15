import { DbObject } from "../../lib/DbObject.model";
import { foreign, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { User } from "../user/models/User.model";

export class ItemCategory extends DbObject {
    @varchar(255, { required: true })
    name: string;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    organization: string;
}