import { TlsCertificate } from "methods/tlsCertificate/TlsCertificate.model";
import { getCertificate } from "../../lib/node-server";
import { HttpError, route } from "../../lib/server";
import { createCertificate } from "../../lib/ssl";
import * as dns from "dns";

export default route(async function (params) {
    // get ip A record for turbobuilt.com
    let records = await dns.promises.resolve4("turbobuilt.com", { ttl: true });
    let turbobuiltIp = records[0].address;
    return { ip: turbobuiltIp };
});