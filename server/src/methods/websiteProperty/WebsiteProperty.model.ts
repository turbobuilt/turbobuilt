import { Website } from "methods/website/Website.model";
import { DbObject } from "../../lib/DbObject.model";
import { foreign, json, varchar } from "../../lib/schema";
import { Item } from "../item/Item.model";
import { ItemPropertyType } from "../itemPropertyType/ItemPropertyType.model";
import { Organization } from "../organization/Organization.model";
import { WebsiteItem } from "methods/websiteItem/WebsiteItem.model";

export class WebsiteProperty extends DbObject {
    @varchar(255, { required: true })
    name: string;

    @foreign({ type: () => ItemPropertyType, onDelete: 'restrict', onUpdate: 'restrict', notNull: true })
    type: string;

    @json()
    value: any;

    @foreign({ type: () => WebsiteItem, onDelete: "cascade", onUpdate: "cascade", notNull: false })
    website?: any;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;
}