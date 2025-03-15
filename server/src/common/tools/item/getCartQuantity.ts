import { HydratedClientItem, ShoppingCart } from "../cart/cart";

export default function(shoppingCart: ShoppingCart, item: HydratedClientItem) {
    let guid = item?.guid;
    if (!guid) {
        throw new Error("item doesn't have a guid");
    }
    let lineItem = shoppingCart.lineItems.find(sci => sci.item.guid === guid);
    if (!lineItem)
        return 0;
    return lineItem.quantity || 0;
}