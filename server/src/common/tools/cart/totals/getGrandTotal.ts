import { ShoppingCart } from "../cart";
import getSubtotal from "./getSubtotal";
import getTotalTax from "./getTotalTax";

export default function (cart: ShoppingCart) {
    console.log("Getting grand total for", cart)
    let subtotal = getSubtotal(cart);
    let tax = getTotalTax(cart);
    return { total: parseFloat((subtotal + tax).toFixed(2)), currency: 'usd', currencySymbol: '$' };
}