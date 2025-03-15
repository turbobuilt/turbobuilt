import { DbObject } from "../../lib/DbObject.model";
import { bigInt, bit, foreign, text, varchar } from "../../lib/schema";
import { Item } from "../item/Item.model";
import { Organization } from "../organization/Organization.model";

export class ItemImage extends DbObject {
    @foreign({ type: () => Item, onDelete: 'restrict', onUpdate: 'restrict', notNull:true })
    item: string;

    @bigInt()
    size: number;

    @bit()
    uploaded: boolean;

    @text()
    name: string;

    @text()
    description: string;

    @varchar(255)
    contentType: string;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    organization: string;
}