import { DbObject } from "lib/DbObject.model";
import { bit, foreign, text, varchar } from "lib/schema";


export class OrganizationInvitation extends DbObject {
    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    organization: string;

    @text()
    email: string;

    @text()
    name: string;

    @varchar(100)
    token: string;
    
    @bit()
    inviteSent: boolean;
}