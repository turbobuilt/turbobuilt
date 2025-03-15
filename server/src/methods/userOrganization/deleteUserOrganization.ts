import { HttpError, route } from "lib/server";
import { UserOrganization } from "./UserOrganization.model";

export default route(async function (params, guid) {
    let [userOrganization] = await UserOrganization.fromQuery(`SELECT UserOrganization.*
        FROM UserOrganization
        WHERE UserOrganization.guid = ? AND UserOrganization.organization = ?`, [guid, params.organization.guid]);
    if (!userOrganization) {
        throw new HttpError(400, "User organization not found");
    }
    await userOrganization.delete();
    return { success: true };
});
    