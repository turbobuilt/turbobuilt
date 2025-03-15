import { ShoppingCart } from "../cart/cart";

export default async function (data: { cart: ShoppingCart }): Promise<ShoppingCart> {
    localStorage.setItem("shoppingCart", JSON.stringify(data.cart));
    return data.cart;
}