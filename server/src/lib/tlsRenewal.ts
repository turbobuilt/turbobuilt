import db from "./db";
import { createCertificate } from "./ssl";
import { CronJob } from 'cron';

export async function tlsRenewal() {
    // 6 dats
    let results = await db.query(`SELECT * FROM TlsCertificate WHERE expires < DATE_ADD(NOW(), INTERVAL 6 DAY)`);
    for (let result of results) {
        try {
            console.log("Renewing certificate for", result.domain, "expires", result.expires);
            let domains = [result.domain];
            if (result.domain.split(".").length == 2) {
                domains.push("www." + result.domain);
            }
            await createCertificate(domains, result.organization);
        } catch (err) {
            console.error("Error renewing certificate", result.domain,  err);
        }
    }
}

export function startTlsRenewalCron() {
    const job = new CronJob(
        '0 31 4 * * *', // cronTime: runs every day at 4:31 GMT
        function () {
            tlsRenewal();
        },
        null, // onComplete
        true, // start
        'GMT' // timeZone
    );
}