import { DbObject } from "../DbObject.model";

export class ItemProperty extends DbObject {
    item: string;
    name: string;
    type: string;
    systemUse: boolean;
    value: any;
    website?: any;
    organization: string;
}
