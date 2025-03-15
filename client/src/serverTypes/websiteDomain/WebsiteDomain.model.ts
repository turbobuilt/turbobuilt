import { DbObject } from "../DbObject.model";

export class WebsiteDomain extends DbObject {
    domain: string;
    website: string;
    organization: string;
}
