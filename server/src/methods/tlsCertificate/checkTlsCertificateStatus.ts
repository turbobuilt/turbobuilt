import { WebsiteDomain } from "methods/websiteDomain/WebsiteDomain.model";
import db from "../../lib/db";
import { route } from "../../lib/server";
import { TlsCertificate } from "./TlsCertificate.model";

export default route(async function (params, domain: string) {
    let [certificate] = await TlsCertificate.fromQuery(`SELECT * FROM TlsCertificate WHERE domain=? AND organization=?`, [domain, params.organization.guid])
    if (certificate) {
        delete certificate.certificate;
        delete certificate.key;
    }
    return { certificate }
});