import callMethod from "../../lib/callMethod";
import { TlsCertificate } from "./TlsCertificate.model";

export default function checkTlsCertificateStatus(domain: string) {
    return callMethod("tlsCertificate.checkTlsCertificateStatus", [...arguments]) as Promise<{ error?: string, data: { certificate: import("/home/me/turbobuilt/server/src/methods/tlsCertificate/TlsCertificate.model").TlsCertificate; } }>;
};
