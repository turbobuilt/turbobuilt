import { DbObject } from "../DbObject.model";

export class Organization extends DbObject {
    name: string;
    owner: string;
}
