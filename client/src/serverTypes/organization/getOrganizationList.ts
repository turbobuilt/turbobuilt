import callMethod from "../../lib/callMethod";
                     
export default function getOrganizationList() {
    return callMethod("organization.getOrganizationList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
