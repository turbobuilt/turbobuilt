import nodemailer from "nodemailer";
import dns from "dns/promises"
import { Website } from "methods/website/Website.model";
import { getDkimKeyForWebsite } from "methods/dkimKey/getDkimKeyForWebsite";
import { readFile } from "fs/promises";
import ejs from "ejs";

export async function sendEmail({ to, from, subject, html, text, template, data }: { to: string[] | string, from: string, subject?: string, html?: string, text?: string, template?: string, data?: any }) {
    try {
        console.log('sending email');

        // Ensure we have an array of recipients
        const recipients = Array.isArray(to) ? to : [to];

        // Validate 'from' domain
        let fromDomain = from.split('@')[1];
        if (!fromDomain) {
            throw new Error('Invalid from address');
        }

        let dkimKey = {
            guid: null,
            publicKey: null,
            privateKey: await readFile('dkim_private.key', 'utf-8'),
        }
        if (fromDomain !== 'turbobuilt.com') {
            // Fetch website and DKIM key info
            let [website] = await Website.fromQuery(`SELECT * FROM Website WHERE domain=?`, [fromDomain]);
            if (!website) {
                throw new Error('Website not found');
            }
            dkimKey = await getDkimKeyForWebsite(website.guid);
            if (!dkimKey) {
                throw new Error('DKIM key not found for website ' + website.guid);
            }
            // Do DNS query for the txt record
            let txtRecords = await dns.resolveTxt("turbobuilt._domainkey." + fromDomain);
            console.log("fromDomain is", fromDomain, "txtRecords are", txtRecords);
            let dkimRecord = txtRecords.find(record => record.join('').includes('v=DKIM1'));
            if (!dkimRecord) {
                throw new Error('DKIM record not found for domain ' + fromDomain);
            }

            // Check to make sure it matches the DKIM key
            if (dkimRecord.join('').includes(dkimKey.publicKey)) {
                console.log('DKIM record matches key');
            } else {
                throw new Error('DKIM record does not match key');
            }
        }


        // Group recipients by domain so we handle each domain's DNS separately
        const recipientsByDomain: Record<string, string[]> = {};
        for (const r of recipients) {
            const domainPart = r.split('@')[1];
            if (!domainPart) {
                throw new Error('Invalid to address: ' + r);
            }
            if (!recipientsByDomain[domainPart]) {
                recipientsByDomain[domainPart] = [];
            }
            recipientsByDomain[domainPart].push(r);
        }

        let allResults = [];

        // For each domain, resolve MX and send emails
        for (const domain of Object.keys(recipientsByDomain)) {
            const domainRecipients = recipientsByDomain[domain];

            // Resolve MX records for each domain
            const addresses = await dns.resolveMx(domain);
            if (addresses.length === 0) {
                throw new Error('No MX records found for domain ' + domain);
            }

            addresses.sort((a, b) => a.priority - b.priority);
            const mxAddress = addresses[0].exchange;
            console.log("mx for", domain, "is", mxAddress);

            let transporter = nodemailer.createTransport({
                host: mxAddress,
                port: 25,
                tls: {
                    rejectUnauthorized: false
                },
                logger: true
            });

            if (template) {
                // read ejs from src/emails/${template}.ejs
                // compile ejs with data
                let templateContent = await readFile(`src/emails/${template}.ejs`, 'utf-8');
                let compiled = ejs.compile(templateContent);
                html = compiled({ ...data, subject });
            }

            let mailOptions = {
                from: from,
                to: domainRecipients.join(', '),
                subject: subject,
                text: text,
                html: html,
                dkim: {
                    domainName: fromDomain,
                    keySelector: 'turbobuilt',
                    privateKey: dkimKey.privateKey
                }
            };

            if (process.env.NODE_ENV === 'development') {
                console.log('Would have sent email:', mailOptions);
                continue;
            } else {
                console.log("will send to", domainRecipients);
                let info = await transporter.sendMail(mailOptions);
                console.log('Email sent to', domain, ':', info.response);
                allResults.push(info);
            }
        }

        return allResults;
    } catch (error) {
        console.error('Error sending email:', error);
        // throw error;
    }
}