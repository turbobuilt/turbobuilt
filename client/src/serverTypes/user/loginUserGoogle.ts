import callMethod from "../../lib/callMethod";
import { OauthLoginResponseData } from "./loginUserGoogle";

export default function loginUserGoogle({ token }) {
    return callMethod("user.loginUserGoogle", [...arguments]) as Promise<{ error?: string, data: import("/home/me/turbobuilt/server/src/methods/user/loginUserGoogle").OauthLoginResponseData }>;
};
