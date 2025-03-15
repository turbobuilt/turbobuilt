import getCart from "./getCart";

export async function getTotalItemsCount() {
    let cart = await getCart();
    return cart.lineItems.reduce((acc, val) => acc + parseInt(val.quantity as any || "0"), 0);
}