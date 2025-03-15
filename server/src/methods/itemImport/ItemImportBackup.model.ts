import { Upload } from "methods/upload/Upload.model";
import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, json, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { User } from "../user/models/User.model";
import { Item } from "methods/item/Item.model";
import { WebsitePage } from "methods/websitePage/WebsitePage.model";
import { WebsitePageItem } from "methods/websitePageItem/WebsitePageItem.model";
import { WebsiteItem } from "methods/websiteItem/WebsiteItem.model";
import { ItemImport } from "./ItemImport.model";

export class ItemImportBackup extends DbObject {
    @foreign({ type: () => ItemImport, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    itemImport: string;
    
    @varchar(255)
    tableName: string;

    @json()
    data: any;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;
}
