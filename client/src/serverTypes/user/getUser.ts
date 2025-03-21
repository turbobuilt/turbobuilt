import callMethod from "../../lib/callMethod";

export default function getUser() {
    return callMethod("user.getUser", [...arguments]) as Promise<{ error?: string, data: { user: Omit<import("/home/me/turbobuilt/server/src/methods/user/models/User.model").User, "passwordHash" | "getClientSafeUser" | "fetch" | "save" | "delete">; organizationList: any[]; userState: any; } }>;
};
