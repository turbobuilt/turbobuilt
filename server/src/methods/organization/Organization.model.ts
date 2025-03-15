import { Related, RelatedItems } from "../../lib/db/relatedItem";
import { DbObject } from "../../lib/DbObject.model";
import { foreign, varchar } from "../../lib/schema";
import { Item } from "../item/Item.model";
import { User } from "../user/models/User.model";

export class Organization extends DbObject {
    @varchar(255)
    name: string;

    
    @foreign({ type: () => User, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    owner: string;

    // // @related({ type: () => Item, key: 'organization' })
    // items: Item[];

    // items = new Related<Item>({ parent: this, key: 'organization', type: () => Item });

    // get items() {
    //     return new Related<Item>(Item, { organization: this.id });
    // }
}
// var x = new Organization();
// let y = x.items.getMany();

// let organization = new Organization();
// organization.related("items", Item);