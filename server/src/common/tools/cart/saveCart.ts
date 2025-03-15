import { ShoppingCart, ShoppingCartLineItem } from "./cart";

export default async function (cart: ShoppingCart) : Promise<ShoppingCart> {
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
    return cart;
}