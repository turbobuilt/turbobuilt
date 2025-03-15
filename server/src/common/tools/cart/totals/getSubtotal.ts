import { ShoppingCart } from "../cart";
import getLineItemTotal from "./getLineItemTotal";

export default function (cart: ShoppingCart) {
    console.log("Getting subtotal for", cart)
    let subtotal = 0;
    for(let lineItem of cart.lineItems) {
        subtotal += getLineItemTotal(lineItem) || 0;
    }
    return parseFloat(subtotal.toFixed(2));
}