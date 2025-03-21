import callMethod from "../../lib/callMethod";

export default function saveOrganization(clientItem: Organization) {
    return callMethod("organization.saveOrganization", [...arguments]) as Promise<{ error?: string, data: any }>;
};
