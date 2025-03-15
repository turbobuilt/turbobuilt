import { TlsCertificate } from "methods/tlsCertificate/TlsCertificate.model";
import { getCertificate } from "../../lib/node-server";
import { HttpError, route } from "../../lib/server";
import { createCertificate } from "../../lib/ssl";
import { Website } from "./Website.model";

export default route(async function (params, guid: string) {
    let [website] = await Website.fetch(guid, params.organization.guid);
    console.log("Checking certificates for www." + website.domain);

    let cert = await getCertificate(website.domain);
    
    return { tlsActivated: cert ? true : false };
});