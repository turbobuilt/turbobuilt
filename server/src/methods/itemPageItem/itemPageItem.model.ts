import { DbObject } from "../../lib/DbObject.model";
import { foreign, varchar } from "../../lib/schema";
import { Item } from "../item/Item.model";
import { ItemPage } from "../itemPage/ItemPage.model";
import { Organization } from "../organization/Organization.model";
import { User } from "../user/models/User.model";

export class ItemPageItem extends DbObject {
    @foreign({ type: () => Item, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    item: string;

    @foreign({ type: () => ItemPage, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    itemPage: string;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    organization: string;
}