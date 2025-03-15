import callMethod from "../../../../../client/src/lib/callMethod";
import { ShoppingCart } from "../cart/cart";

export default async function (cart: ShoppingCart): Promise<any> {
    if (typeof window !== "undefined") {
        let result = await callMethod("payment.paypal.createPaypalOrder", [cart]);
        return result;
    } else {

    }
}