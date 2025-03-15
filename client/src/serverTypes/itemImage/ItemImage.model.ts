import { DbObject } from "../DbObject.model";

export class ItemImage extends DbObject {
    item: string;
    size: number;
    uploaded: boolean;
    name: string;
    description: string;
    contentType: string;
    organization: string;
}
