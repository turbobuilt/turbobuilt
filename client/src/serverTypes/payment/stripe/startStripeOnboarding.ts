import callMethod from "../../../lib/callMethod";

export default function startStripeOnboarding(organizationId: string) {
    return callMethod("payment.stripe.startStripeOnboarding", [...arguments]) as Promise<{ error?: string, data: { url: any; } }>;
};
