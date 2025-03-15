import { DbObject } from "../../DbObject.model";

export class AuthToken extends DbObject {
    token: string;
    user: string;
}
