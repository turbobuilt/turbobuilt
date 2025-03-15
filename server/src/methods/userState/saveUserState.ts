import { route } from "lib/server";
import { UserState } from "./UserState.model";

export default route(async function (params, clientUserState) {
    let userState = await UserState.init(clientUserState);
    userState.user = params.user.guid;
    await userState.save();
    return userState;
});