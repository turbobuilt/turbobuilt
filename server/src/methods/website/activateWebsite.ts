import { TlsCertificate } from "methods/tlsCertificate/TlsCertificate.model";
import { getCertificate } from "../../lib/node-server";
import { HttpError, route } from "../../lib/server";
import { createCertificate } from "../../lib/ssl";
import { Website } from "./Website.model";

export default route(async function (params, guid: string) {
    let [website] = await Website.fetch(guid, params.organization.guid);
    // if (website.activated) {
    //     throw new HttpError(400, "Website is already activated");
    // }

    console.log("Checking certificates for www." + website.domain);
    // // let cert = await getCertificate("www." + website.domain);
    // let [wwwCert] = await TlsCertificate.fromQuery(`SELECT guid FROM TlsCertificate WHERE domain=? AND privateKey IS NOT NULL`, ["www." + website.domain]);
    // if (!wwwCert) {
    //     console.log("Creating certificates for www." + website.domain);
    //     try {
    //         await createCertificate(["www." + website.domain]);
    //     } catch (e) {
    //         console.log("Error creating certificate", e);
    //         throw new HttpError(500, "Error creating certificate for www." + website.domain);
    //     }
    // }

    let [siteCert] = await TlsCertificate.fromQuery(`SELECT guid FROM TlsCertificate WHERE domain=? AND privateKey IS NOT NULL`, [website.domain]);
    if (!siteCert) {
        console.log("Creating certificates for " + website.domain);
        let domains = [website.domain];
        if (website.domain.split(".").length === 2) {
            domains.push("www." + website.domain);
        }
        try {
            await createCertificate(domains, params.organization.guid);
        } catch (e) {
            console.log("Error creating certificate", e);
            throw new HttpError(500, "Error creating certificate for " + website.domain + " " + e.message);
        }
    }
    // return website;
    // website.activated = true;
    // await website.save();
    return website;
});