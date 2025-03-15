import callMethod from "../../lib/callMethod";
                     
export default function getModels(query: string) {
    return callMethod("car.getModels", [...arguments]) as Promise<{ error?: string, data: { results: any; } }>;
};
