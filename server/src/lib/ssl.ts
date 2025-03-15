import acme from "acme-client";
import * as dns from "node:dns";
import fs from "fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { getCertificate } from "./node-server";
import { HttpError } from "./server";
import { TlsCertificate } from "methods/tlsCertificate/TlsCertificate.model";
import { X509Certificate } from 'crypto';
import moment from "moment";


const publicPath = join(process.cwd(), "public");
function log(m) {
    console.log(m)
}

async function getFileDir(authz, challenge) {
    let domain = authz.identifier.value;
    let dir = `${publicPath}/.well-known/acme-challenge`;
    await fs.mkdir(dir, { recursive: true })
    const filePath = `${dir}/${challenge.token}`;
    return filePath
}

async function challengeCreateFn(authz, challenge, keyAuthorization) {
    log('Triggered challengeCreateFn()');
    console.log(authz, challenge, keyAuthorization)

    /* http-01 */
    if (challenge.type === 'http-01') {
        const fileContents = keyAuthorization;
        let filePath = await getFileDir(authz, challenge);
        log(`Creating challenge response for ${authz.identifier.value} at path: ${filePath}`);
        log(`Would write "${fileContents}" to path "${filePath}"`);
        await fs.writeFile(filePath, fileContents);
    }
}

async function challengeRemoveFn(authz, challenge, keyAuthorization) {
    log('Triggered challengeRemoveFn()');
    let domain = authz.identifier.value;

    /* http-01 */
    if (challenge.type === 'http-01') {
        let filePath = await getFileDir(authz, challenge);
        log(`Removing challenge response for ${authz.identifier.value} at path: ${filePath}`);
        log(`Would remove file on path "${filePath}"`);
        await fs.unlink(filePath);
    }
}

/**
 * Main
 */
export async function createCertificate(domains: string[], organization?: string) {
    // first run a quick dns check to make sure the ip A record resolves to XXX.XXX.XXX.XXX
    let records = await Promise.all(domains.concat(["portal.turbobuilt.com"]).map(domain => dns.promises.resolve4(domain, { ttl: true })));
    let myIp = records.pop()[0].address;
    console.log("My IP is", myIp);
    for (let i = 0; i < records.length; ++i) {
        let record = records[i];
        if (record.length === 0) {
            console.log(record);
            throw new HttpError(400, "No A record for domain " + domains[i] + `. Please create an A record for ${domains[i]} that points to ${myIp}. If you have no clue what this means, please ask your domain registrar, or just search the internet and it shouldn't be too hard.  Basically when you buy a domain you have to point it to this server so we can show your website!`);
        } else if (record[0].address !== myIp) {
            console.log(record);
            throw new HttpError(400, `A record for domain ${domains[i]} does not resolve to the correct IP. It currently resolves to ${record[0].address} which is NOT CORRECT. Please update the A record to point to ${myIp}.  If you have no clue what this means, please ask your domain registrar, or just search the internet and it shouldn't be too hard.  Basically when you buy a domain you have to point it to this server so that we can show your website!`);
        }
    }
    console.log(records[0]);

    /* Init client */
    let privateKey = await acme.crypto.createPrivateRsaKey();
    console.log(privateKey)
    console.log("makingclient")
    const client = new acme.Client({
        directoryUrl: acme.directory.letsencrypt.production,
        accountKey: await acme.crypto.createPrivateRsaKey(2048),
    });
    console.log("making csr")
    /* Create CSR */
    const [key, csr] = await acme.crypto.createCsr({
        altNames: domains,
    });
    console.log("making certificate")
    /* Certificate */
    const cert = await client.auto({
        csr,
        email: 'dane@turbobuilt.com',
        termsOfServiceAgreed: true,
        challengeCreateFn,
        challengeRemoveFn,
        challengePriority: ["http-01", "dns-01"]
    });
    // const cert = { key: "test", certificate: "Test cer" };
    console.log("Got certificate");
    let [tlsRecord] = await TlsCertificate.fromQuery(`SELECT guid FROM TlsCertificate WHERE domain=?`, [domains[0]]);
    if (!tlsRecord) {
        tlsRecord = new TlsCertificate();
        tlsRecord.domain = domains[0];
    }
    tlsRecord.privateKey = key.toString();
    tlsRecord.certificate = cert.toString();
    tlsRecord.organization = organization;
    await tlsRecord.save();
    console.log("saved cert")
    const x509 = new X509Certificate(cert);
    tlsRecord.expires = moment(new Date(x509.validTo).toISOString()).format("YYYY-MM-DD HH:mm:ss");
    await tlsRecord.save();

    // // write them to disk
    // let certDir = "/etc/nginx/ssl";
    // await fs.mkdir(certDir, { recursive: true });
    // for (let domain of domains) {
    //     await fs.writeFile(`${certDir}/${domain}.csr.pem`, cert.toString());
    //     await fs.writeFile(`${certDir}/${domain}.cert.pem`, cert.toString());
    //     await fs.writeFile(`${certDir}/${domain}.key.pem`, key.toString());
    // }

    return await Promise.all(domains.map(domain => getCertificate(domain)));
    // run command /usr/sbin/service
    // return execSync("/usr/sbin/service nginx reload");
};