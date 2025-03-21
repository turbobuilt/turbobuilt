import callMethod from "../../lib/callMethod";
import { OrderData } from "./OrderData.model";

export default function publicSaveOrderData(clientOrderData: any) {
    return callMethod("orderData.publicSaveOrderData", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/orderData/OrderData.model").OrderData }>;
};
