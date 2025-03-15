import { ShoppingCart, ShoppingCartLineItem } from "./cart";
import getCart from "./getCart";

export default async function (lineItem: ShoppingCartLineItem): Promise<ShoppingCart> {
    let cart = await getCart();
    cart.lineItems = cart.lineItems.filter(x => x.item.guid !== lineItem.item.guid);
    return cart;
}