import { ShoppingCart } from "./cart";

export default function isInCart(cart: ShoppingCart, item: any) {
    return cart.lineItems.some(x => x.item.guid === item.guid);
}