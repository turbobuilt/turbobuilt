import { HttpError, route } from "lib/server";
import { UserOrganization } from "methods/userOrganization/UserOrganization.model";
import { randomBytes } from "crypto";

// // saveUserOrganization
// export default route(async function (params, email: string, name?: string) {
//     let [userOrganization] = await UserOrganization.fromQuery(`SELECT UserOrganization.*

// });