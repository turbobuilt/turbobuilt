import callMethod from "../../../lib/callMethod";
                     
export default function checkStripeOnboardingStatus(organizationGuid: string) {
    return callMethod("payment.stripe.checkStripeOnboardingStatus", [...arguments]) as Promise<{ error?: string, data: { complete: any; } }>;
};
