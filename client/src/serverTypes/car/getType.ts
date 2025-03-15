import callMethod from "../../lib/callMethod";
                     
export default function getType(query: string) {
    return callMethod("car.getType", [...arguments]) as Promise<{ error?: string, data: { items: any; quantity: number; } }>;
};
