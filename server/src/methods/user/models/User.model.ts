import { DbObject } from "../../../lib/DbObject.model";
import { bit, varchar,  } from "../../../lib/schema";

export class User extends DbObject {
    @varchar(255)
    displayName?: string;
    @varchar(255)
    email?: string;
    @varchar(255)
    appleId?: string;
    @varchar(255)
    googleId?: string;
    @varchar(255)
    microsoftId?: string;
    @varchar(255)
    facebookId?: string;
    @varchar(255)
    xId?: string;
    @varchar(255)
    signupPlatform?: string;
    @varchar(255)
    city?: string;
    @varchar(255)
    state?: string;
    @varchar(255)
    country?: string;
    @bit()
    verified?: boolean;
    @varchar(255)
    passwordHash?: string;

    constructor(data?: User) {
        super();
        Object.assign(this, data || {});
    }

    getClientSafeUser?() {
        let { passwordHash, ...clientSafeUser } = this;
        return clientSafeUser;
    }
}