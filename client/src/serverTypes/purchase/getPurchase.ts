import callMethod from "../../lib/callMethod";
import { Purchase } from "./Purchase.model";

export default function getPurchase(guid) {
    return callMethod("purchase.getPurchase", [...arguments]) as Promise<{ error?: string, data: { purchase: import("/home/me/turbobuilt/server/src/methods/purchase/Purchase.model").Purchase; } }>;
};
