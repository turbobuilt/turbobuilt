import callMethod from "../../lib/callMethod";
                     
export default function getUserOrganizationList(organizationGuid: string) {
    return callMethod("organization.getUserOrganizationList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
