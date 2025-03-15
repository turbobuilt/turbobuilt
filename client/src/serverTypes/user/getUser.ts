import callMethod from "../../lib/callMethod";
                     
export default function getUser() {
    return callMethod("user.getUser", [...arguments]) as Promise<{ error?: string, data: { user: Omit<User, "passwordHash" | "getClientSafeUser" | "fetch" | "save">; organizationList: any[]; userState: any; } }>;
};
