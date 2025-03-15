import { DbObject } from "../DbObject.model";

export class UserOrganization extends DbObject {
    user: string;
    organization: string;
}
