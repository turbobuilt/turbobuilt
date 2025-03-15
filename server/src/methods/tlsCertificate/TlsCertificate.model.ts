import { DbObject } from "../../lib/DbObject.model";
import { dateTime, foreign, text } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";

export class TlsCertificate extends DbObject {
    @text()
    domain: string;

    @text()
    certificate: string;

    @text()
    privateKey: string;

    @dateTime({ precision: 0 })
    expires: string;

    @foreign({ type: () => Organization, onDelete: 'cascade', onUpdate: 'cascade', notNull:true })
    organization: string;
}