// import callMethod from ;
import { HydratedClientItem, ShoppingCart } from "./cart";
import saveCart from "./saveCart";

export default async function (cart: ShoppingCart, item: HydratedClientItem, options?: { quantity: number }) {
    let quantity = options?.quantity || 1;
    if (typeof window !== "undefined") {
        let existingItem = cart.lineItems.find(existingItem => existingItem.item.guid === item.guid);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.lineItems.push({
                item: item,
                quantity,
            });
        }
        await saveCart(cart);
        return cart;
    } else {
        throw new Error("not implemented")
    }
}