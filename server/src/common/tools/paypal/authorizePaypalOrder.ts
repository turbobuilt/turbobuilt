import callMethod from "../../../../../client/src/lib/callMethod";
import { ShoppingCart } from "../cart/cart";

export default async function (orderID): Promise<any> {
    if (typeof window !== "undefined") {
        let result = await callMethod("payment.paypal.authorizePaypalOrder", [orderID]);
        return result;
    } else {

    }
}