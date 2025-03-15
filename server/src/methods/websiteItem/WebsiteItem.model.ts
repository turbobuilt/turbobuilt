import { DbObject } from "lib/DbObject.model";
import { bit, foreign } from "lib/schema";
import { Item } from "methods/item/Item.model";
import { Organization } from "methods/organization/Organization.model";
import { Website } from "methods/website/Website.model";


export class WebsiteItem extends DbObject {

    @foreign({ type: () => Website, notNull: true, onDelete: "cascade", onUpdate: "cascade" })
    website: string;

    @foreign({ type: () => Item, notNull: true, onDelete: "cascade", onUpdate: "cascade" })
    item: string;

    @foreign({ type: () => Organization, notNull: true, onDelete: "cascade", onUpdate: "cascade" })
    organization: string;
}