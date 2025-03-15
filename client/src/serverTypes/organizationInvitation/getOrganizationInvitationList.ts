import callMethod from "../../lib/callMethod";

export default function getOrganizationInvitationList(organizationGuid: string) {
    return callMethod("organizationInvitation.getOrganizationInvitationList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
