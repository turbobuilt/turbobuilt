import { Upload } from "methods/upload/Upload.model";
import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, json, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { User } from "../user/models/User.model";
import { Item } from "methods/item/Item.model";
import { WebsitePage } from "methods/websitePage/WebsitePage.model";
import { WebsitePageItem } from "methods/websitePageItem/WebsitePageItem.model";
import { WebsiteItem } from "methods/websiteItem/WebsiteItem.model";
import { ItemImportTask } from "./ItemImportTask.model";

export class ItemImport extends DbObject {
    @foreign({ type: () => Item, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    item: string;

    @foreign({ type: () => ItemImportTask, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    itemImportTask: string;

    @foreign({ type: () => WebsitePage, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    websitePage: string;

    @foreign({ type: () => WebsitePageItem, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    websitePageItem: string;

    @foreign({ type: () => WebsiteItem, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    websiteItem: string;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;
}
