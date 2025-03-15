import { DbObject } from "../DbObject.model";

export class ItemImport extends DbObject {
    item: string;
    websitePage: string;
    websitePageItem: string;
    websiteItem: string;
    organization: string;
}
