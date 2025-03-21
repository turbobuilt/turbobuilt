import { DbObject } from "../../DbObject.model";

export class User extends DbObject {
    displayName?: string;
    email?: string;
    appleId?: string;
    googleId?: string;
    microsoftId?: string;
    facebookId?: string;
    xId?: string;
    signupPlatform?: string;
    city?: string;
    state?: string;
    country?: string;
    verified?: boolean;
    passwordHash?: string;
}
