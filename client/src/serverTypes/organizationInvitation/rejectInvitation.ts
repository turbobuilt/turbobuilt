import callMethod from "../../lib/callMethod";
                     
export default function rejectInvitation(token: string) {
    return callMethod("organizationInvitation.rejectInvitation", [...arguments]) as Promise<{ error?: string, data: { success: boolean; } }>;
};
