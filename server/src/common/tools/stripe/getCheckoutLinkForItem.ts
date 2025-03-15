import addToCart from "../cart/addToCart";
import { getNewCart } from "../cart/getCart";
import getStripeCheckoutLink from "./getStripeCheckoutLink";

export default async function (item: any, quantity = 1) {
    let newCart = getNewCart();
    addToCart(newCart, item.guid, { quantity });
    var link = await getStripeCheckoutLink(newCart);
    return link;
}