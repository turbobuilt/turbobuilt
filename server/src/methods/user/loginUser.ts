import { UserState } from "methods/userState/UserState.model";
import db from "../../lib/db";
import { AuthToken } from "./models/AuthToken.model";
import { User } from "./models/User.model";

export async function loginUser(user: User) {
    const authToken = new AuthToken();
    await authToken.generate(user.guid);
    return {  ...await getUserData(user), authToken: authToken.token };
}

export async function getUserData(user: User) {
    if(!user || !user.guid) {
        throw new Error("Invalid user");
    }
    let organizationList = await db.query(`SELECT Organization.*
        FROM Organization 
        JOIN UserOrganization ON Organization.guid = UserOrganization.organization
        WHERE UserOrganization.user = ?
        GROUP BY Organization.guid`, [user.guid]);

    let userState = await UserState.getForUser(user.guid);
    // make sure userState.currentOrganization is in organizationList, if not, pick first
    if(!userState.currentOrganization)
        userState.currentOrganization = organizationList[0].guid;
    else if (!organizationList.find(org => org.guid === userState.currentOrganization)) {
        userState.currentOrganization = organizationList[0].guid;
        await userState.save();
    }
    return { user: user.getClientSafeUser(), organizationList, userState };
}