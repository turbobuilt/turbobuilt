import { DbObject } from "../DbObject.model";

export class Purchase extends DbObject {
    cart: ShoppingCart;
    details: any;
    total: number;
    state: "created" | "pending" | "failed" | "succeeded" | "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "requires_capture" | "canceled";
    stripeSessionId?: string;
    website?: string;
    organization?: string;
}
