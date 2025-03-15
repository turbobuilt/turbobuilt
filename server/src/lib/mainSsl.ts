import { getCertificate } from "./node-server";
import { createCertificate } from "./ssl";

export async function ensureMainSsl() {
    let cert = await getCertificate("portal.turbobuilt.com");
    if (!cert) {
        console.log("Creating certificates for portal.turbobuilt.com");
        await createCertificate(["portal.turbobuilt.com"]);
    }
}