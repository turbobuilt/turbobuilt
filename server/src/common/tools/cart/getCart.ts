import getItemList from "../item/getItemList";
import { ShoppingCart, ShoppingCartLineItem } from "./cart";

const defaultCartData = {
    lineItems: [] as ShoppingCartLineItem[]
} as ShoppingCart;
var cart = null;

export function getNewCart() {
    return JSON.parse(JSON.stringify(defaultCartData));
}

export async function clearCart() {
    for (let key in cart) {
        delete cart[key];
    }
    Object.assign(cart, {
        lineItems: [] as ShoppingCartLineItem[]
    } as ShoppingCart);
    return cart;
}

export default async function (params?: { omitDetails: boolean }): Promise<ShoppingCart> {
    if (cart) {
        console.log("cart exists returning")
        return cart;
    } else {
        console.log("cart doesn't exist")
    }
    cart = JSON.parse(JSON.stringify(defaultCartData));
    if (typeof window !== "undefined" && (window as any).Vue) {
        cart = (window as any).Vue.reactive(cart);
        console.log("VUE EXISTS")
    } else {
        console.log("VUE DOESN'T EXIST")
    }

    console.log("cart doesn't exist -fetching")
    try {
        let str = localStorage.getItem("shoppingCart");
        if (str) {
            let cartData = JSON.parse(str);
            for (let key in cart)
                delete cart[key];
            Object.assign(cart, cartData);
        }
        await hydrateCart(cart, params);
    } catch (err) {
        console.log(err);
    }
    return cart;
}

export async function hydrateCart(cart: ShoppingCart, params?: { omitDetails: boolean }) {
    if (cart.lineItems.length && !params?.omitDetails) {
        let itemListResponse = await getItemList({ guids: cart.lineItems.map(val => val.item.guid) });
        let itemList = itemListResponse.data.items;
        for (let lineItem of cart.lineItems) {
            lineItem.item = itemList.find(serverItem => serverItem.guid === lineItem.item.guid);
        }
        // filter ones without item
        cart.lineItems = cart.lineItems.filter(item => item.item);
    }
}