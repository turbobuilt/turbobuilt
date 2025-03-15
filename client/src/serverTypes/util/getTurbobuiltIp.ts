import callMethod from "../../lib/callMethod";
                     
export default function getTurbobuiltIp() {
    return callMethod("util.getTurbobuiltIp", [...arguments]) as Promise<{ error?: string, data: { ip: string; } }>;
};
