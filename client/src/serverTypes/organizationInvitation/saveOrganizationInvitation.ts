import callMethod from "../../lib/callMethod";

export default function saveOrganizationInvitation(organizationGuid: string, email: string, name?: string) {
    return callMethod("organizationInvitation.saveOrganizationInvitation", [...arguments]) as Promise<{ error?: string, data: any }>;
};
