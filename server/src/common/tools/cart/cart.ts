// import { Item } from "../../../../../client/src/serverTypes/item/Item.model"

export function parseItem(clientItem: any) {
    return clientItem;
}

export type HydratedClientItem = { guid: string, name:string, organization:string, addToAllSites:boolean } & { properties: { name?: string, type?: { guid?: string, name?: string }, value: any }[], imageUrls: string[], description: string, basePrice: number, currency: string, currencySymbol: string }
export class ShoppingCartLineItem {
    quantity?: number
    item?: HydratedClientItem

    static parse(clientShoppingCartItem: ShoppingCartLineItem) {
        let shoppingCartItem = new ShoppingCartLineItem();
        Object.assign(shoppingCartItem, clientShoppingCartItem);
        if (shoppingCartItem.item) {
            shoppingCartItem.item = parseItem(shoppingCartItem.item)
        }
        return shoppingCartItem;
    }
}

export class ShoppingCart {
    lineItems: ShoppingCartLineItem[]

    getTotals?() {
        let total = 0;
        for (let lineItem of this.lineItems) {
            let price = parseFloat(lineItem.item.properties.find(item => item.name.toLowerCase().trim() === 'price').value) || 0;
            let quantity = lineItem.quantity || 1;
            total += price * quantity;
        }
        return {
            total: { currency: "USD", amount: total }
        };
    }

    static parse(clientCart: ShoppingCart) {
        let cart = new ShoppingCart();
        Object.assign(cart, clientCart);
        for (let i = 0; i < cart.lineItems.length; ++i) {
            cart.lineItems[i] = ShoppingCartLineItem.parse(cart.lineItems[i]);
        }
        return cart;
    }
}