import callMethod from "../../lib/callMethod";
                     
export default function method(methodName: string) {
    return callMethod("clientApi.method", [...arguments]) as Promise<{ error?: string, data: string }>;
};
