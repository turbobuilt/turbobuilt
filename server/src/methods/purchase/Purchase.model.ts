import { ShoppingCart } from "common/tools/cart/cart";
import { DbObject } from "../../lib/DbObject.model";
import { date, dateTime, decimal, foreign, json, text, time, varchar } from "lib/schema";
import { Organization } from "methods/organization/Organization.model";
import { Website } from "methods/website/Website.model";

export class Purchase extends DbObject {
    @json()
    cart: ShoppingCart;

    @json()
    details: any;

    @decimal({ totalDigits: 14, decimalDigits: 2 })
    total: number;

    @varchar(255)
    state: "created" | "pending" | "failed" | "succeeded" | "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "requires_capture" | "canceled"

    @varchar(255)
    stripeSessionId?: string;

    @foreign({ type: () => Website, notNull: true, onDelete: 'restrict', onUpdate: 'cascade' })
    website?: string;

    @foreign({ type: () => Organization, notNull: true, onDelete: "restrict", onUpdate: "cascade" })
    organization?: string;
}
