import callMethod from "../../lib/callMethod";
                     
export default function deleteUserOrganization(guid) {
    return callMethod("userOrganization.deleteUserOrganization", [...arguments]) as Promise<{ error?: string, data: { success: boolean; } }>;
};
