import { DbObject } from "../DbObject.model";

export class TlsCertificate extends DbObject {
    domain: string;
    certificate: string;
    privateKey: string;
    expires: string;
    organization: string;
}
