import { Upload } from "methods/upload/Upload.model";
import { DbObject } from "../../lib/DbObject.model";
import { bigInt, bit, foreign, json, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";
import { User } from "../user/models/User.model";
import { Item } from "methods/item/Item.model";
import { WebsitePage } from "methods/websitePage/WebsitePage.model";
import { WebsitePageItem } from "methods/websitePageItem/WebsitePageItem.model";
import { WebsiteItem } from "methods/websiteItem/WebsiteItem.model";
import { ItemImport } from "./ItemImport.model";

export class ItemImportTask extends DbObject {
    @bit()
    rolledBack: boolean;

    @bigInt()
    recordsCount: number;

    @bit()
    completed: boolean;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;
}
