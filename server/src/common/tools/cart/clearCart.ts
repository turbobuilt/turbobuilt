import { ShoppingCart, ShoppingCartLineItem } from "./cart";
import saveCart from "./saveCart";

export async function getDefaultCart() {
    return {
        lineItems: [] as ShoppingCartLineItem[]
    } as ShoppingCart;
}

export default async function (): Promise<ShoppingCart> {
    let cart = await getDefaultCart();
    await saveCart(cart);
    return cart;
}