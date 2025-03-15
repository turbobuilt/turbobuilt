import callMethod from "../../lib/callMethod";
import { TlsCertificate } from "./TlsCertificate.model";

export default function checkTlsCertificateStatus(domain: string) {
    return callMethod("tlsCertificate.checkTlsCertificateStatus", [...arguments]) as Promise<{ error?: string, data: { certificate: TlsCertificate; } }>;
};
