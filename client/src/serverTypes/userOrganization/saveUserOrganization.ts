import callMethod from "../../lib/callMethod";
                     
export default function saveUserOrganization(email: string, name?: string) {
    return callMethod("userOrganization.saveUserOrganization", [...arguments]) as Promise<{ error?: string, data: any }>;
};
