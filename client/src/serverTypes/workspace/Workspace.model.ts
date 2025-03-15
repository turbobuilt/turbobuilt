import { DbObject } from "../DbObject.model";

export class Workspace extends DbObject {
    name: string;
    identifier: string;
    organization: string;
}
