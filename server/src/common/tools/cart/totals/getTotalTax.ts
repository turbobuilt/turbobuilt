import { ShoppingCart } from "../cart";
import getSubtotal from "./getSubtotal";

export default function (cart: ShoppingCart) {
    let subtotal = getSubtotal(cart);
    let tax =  subtotal * 0;
    return parseFloat(tax.toFixed(2));
}