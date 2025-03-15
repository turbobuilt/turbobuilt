import { DbObject } from "../DbObject.model";

export class Website extends DbObject {
    name: string;
    domain: string;
    organization: string;
    activated: boolean;
    isTest?: boolean;
}
