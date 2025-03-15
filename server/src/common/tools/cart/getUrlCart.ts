import { hydrateCart } from "./getCart";

export default async function(params?: { omitDetails: boolean }) {
    if (!window.location.href.split("?")[1]?.includes("cart=")) {
        return null;
    }
    let cart = null;
    let cartString = window.location.href.split("?")[1].split("cart=")[1]?.split("&")[0];
    try {
        cart = JSON.parse(decodeURIComponent(cartString));
        await hydrateCart(cart, params);
        return cart;
    } catch (err) {
        console.log(err);
    }
    await hydrateCart(cart, params);
    return cart;
}