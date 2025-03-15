import callMethod from "../../lib/callMethod";
                     
export default function saveUserState(clientUserState) {
    return callMethod("userState.saveUserState", [...arguments]) as Promise<{ error?: string, data: any }>;
};
