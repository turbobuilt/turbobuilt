import callMethod from "../../../lib/callMethod";
                     
export default function chargeCardForCart(paymentMethodId: string, cart: ShoppingCart, details: any) {
    return callMethod("payment.stripe.chargeCardForCart", [...arguments]) as Promise<{ error?: string, data: { status: Stripe.PaymentIntent.Status; } }>;
};
