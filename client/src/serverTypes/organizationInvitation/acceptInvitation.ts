import callMethod from "../../lib/callMethod";
                     
export default function acceptInvitation(token: string) {
    return callMethod("organizationInvitation.acceptInvitation", [...arguments]) as Promise<{ error?: string, data: any }>;
};
