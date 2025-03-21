import callMethod from "../../../lib/callMethod";

export default function getStripeCheckoutLink(cart: ShoppingCart, redirectUrl: string, email?:string) {
    return callMethod("payment.stripe.getStripeCheckoutLink", [...arguments]) as Promise<{ error?: string, data: { url: any; } }>;
};
