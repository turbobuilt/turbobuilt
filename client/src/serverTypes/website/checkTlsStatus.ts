import callMethod from "../../lib/callMethod";

export default function checkTlsStatus(guid: string) {
    return callMethod("website.checkTlsStatus", [...arguments]) as Promise<{ error?: string, data: { tlsActivated: boolean; } }>;
};
