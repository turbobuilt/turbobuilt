import callMethod from "../../lib/callMethod";

export default function getOrganization(guid: string) {
    return callMethod("organization.getOrganization", [...arguments]) as Promise<{ error?: string, data: { organization: any; stripeOnboardingComplete: any; } }>;
};
