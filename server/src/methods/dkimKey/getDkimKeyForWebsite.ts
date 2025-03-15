import { Website } from "methods/website/Website.model";
import { DkimKey } from "./DkimKey.model";
import { generateKeyPair } from "crypto";
import { route } from "lib/server";

export default route(async function (params, websiteGuid) {
    return {};
    let [website] = await Website.fetch(websiteGuid, params.organization.guid);
    if (!website) {
        throw new Error("Website not found");
    }
    let dkimKey = await getDkimKeyForWebsite(website.guid);
    delete dkimKey.privateKey;
    return dkimKey;
})

export async function getDkimKeyForWebsite(websiteGuid: string) {
    let [website] = await Website.fromQuery(`SELECT * FROM Website WHERE guid=?`, [websiteGuid]);
    if (!website.domain) {
        throw new Error("Website domain not found");
    }
    let [dkimKey] = await DkimKey.fromQuery(`SELECT * FROM DkimKey WHERE website=?`, [websiteGuid]);
    if (!dkimKey) {
        if (!website) {
            throw new Error("Website not found");
        }
        dkimKey = new DkimKey();
        dkimKey.website = website.guid;
        dkimKey.domain = website.domain;
        const { publicKey, privateKey } = await generateKey();
        dkimKey.publicKey = publicKey;
        dkimKey.privateKey = privateKey;
        await dkimKey.save();
    }
    return {
        guid: dkimKey.guid,
        publicKey: dkimKey.publicKey,
        privateKey: dkimKey.privateKey
    }
}

async function generateKey() {
    // openssl genrsa -out private.key 1024
    return await new Promise<{ publicKey: string, privateKey: string }>((resolve, reject) => {
        generateKeyPair("rsa", { modulusLength: 1024 }, (err, publicKey, privateKey) => {
            if (err) return reject(err);
            resolve({
                publicKey: publicKey.export({ type: "spki", format: "pem" }).toString()
                    .replace(/-----BEGIN [A-Z ]+-----/g, '')  // Remove BEGIN line
                    .replace(/-----END [A-Z ]+-----/g, '')    // Remove END line
                    .replace(/\r?\n|\r/g, ''),                // Remove all line breaks,
                privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
            });
        })
    })
}