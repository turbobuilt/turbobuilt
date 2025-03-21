import callMethod from "../../lib/callMethod";
import { Purchase } from "./Purchase.model";

export default function getPurchaseList(options = { page: 1, perPage: 500 }) {
    return callMethod("purchase.getPurchaseList", [...arguments]) as Promise<{ error?: string, data: { purchases: import("/home/me/turbobuilt/server/src/methods/purchase/Purchase.model").Purchase[]; pagination: { total: any; page: number; perPage: number; pages: number; }; } }>;
};
