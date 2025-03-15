import { ShoppingCart } from "common/tools/cart/cart";
import { DbObject } from "lib/DbObject.model";
import { date, dateTime, decimal, foreign, json, text, time, varchar } from "lib/schema";
import { Organization } from "methods/organization/Organization.model";
import { Website } from "methods/website/Website.model";

export class OrderData extends DbObject {
    @json()
    cart: ShoppingCart;

    @json()
    details: any;

    @decimal({ totalDigits: 12, decimalDigits: 2 })
    tax?: number;

    @decimal({ totalDigits: 12, decimalDigits: 2 })
    total?: number;

    @foreign({ type: () => Website, notNull: true, onDelete: 'restrict', onUpdate: 'cascade' })
    website?: string;

    @foreign({ type: () => Organization, notNull: true, onDelete: "restrict", onUpdate: "cascade" })
    organization?: string;

    @date()
    installationDate?: string;

    @time({ precision: 0 })
    installationTime?: string;

    static parse(clientOrderData: OrderData) {
        let orderData = new OrderData();
        Object.assign(orderData, clientOrderData);
        orderData.cart = ShoppingCart.parse(orderData.cart);
        return orderData;
    }
}