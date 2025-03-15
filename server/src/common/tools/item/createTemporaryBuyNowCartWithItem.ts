import addToCart from "../cart/addToCart";
import { HydratedClientItem } from "../cart/cart";
import { getNewCart } from "../cart/getCart";

export default async function(item: HydratedClientItem) {
    let newCart = getNewCart();
    await addToCart(newCart, item, { quantity: 1 });
    return newCart;
}