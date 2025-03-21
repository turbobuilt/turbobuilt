import callMethod from "../../lib/callMethod";

export default function deleteOrganizationInvitation(organizationGuid: string, guid: string) {
    return callMethod("organizationInvitation.deleteOrganizationInvitation", [...arguments]) as Promise<{ error?: string, data: any }>;
};
