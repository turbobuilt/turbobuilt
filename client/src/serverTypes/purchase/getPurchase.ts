import callMethod from "../../lib/callMethod";
import { Purchase } from "./Purchase.model";

export default function getPurchase(guid) {
    return callMethod("purchase.getPurchase", [...arguments]) as Promise<{ error?: string, data: { purchase: Purchase; } }>;
};
