import { randomBytes } from "crypto";
import { DbObject } from "../../../lib/DbObject.model";
import { foreign, varchar } from "../../../lib/schema";
import bs58 from 'bs58'

export class AuthToken extends DbObject {
    @varchar(255)
    token: string;
    
    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    user: string;

    constructor(data?: AuthToken) {
        super();
        Object.assign(this, data || {});
    }

    async generate(userGuid: string): Promise<string> {
        const buffer = randomBytes(32); // Get 256 bits of random data
        this.token = bs58.encode(buffer); // Encode it in base58
        this.user = userGuid;
        await this.save(); // Save the token
        return this.token; // Return the token
    }
}