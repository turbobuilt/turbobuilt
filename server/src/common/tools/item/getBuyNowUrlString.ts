import addToCart from "../cart/addToCart";
import { HydratedClientItem } from "../cart/cart";
import { getNewCart } from "../cart/getCart";

export default function(item: HydratedClientItem) {
    let newCart = getNewCart();
    addToCart(newCart, item, { quantity: 1 });
    return `cart=${encodeURIComponent(JSON.stringify(newCart))}`;
}