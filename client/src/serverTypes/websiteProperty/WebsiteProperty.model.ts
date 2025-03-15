import { DbObject } from "../DbObject.model";

export class WebsiteProperty extends DbObject {
    name: string;
    type: string;
    value: any;
    website?: any;
    organization: string;
}
