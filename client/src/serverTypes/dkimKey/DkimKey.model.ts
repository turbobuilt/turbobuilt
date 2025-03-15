import { DbObject } from "../DbObject.model";

export class DkimKey extends DbObject {
    privateKey: string;
    publicKey: string;
    website: string;
    domain: string;
}
