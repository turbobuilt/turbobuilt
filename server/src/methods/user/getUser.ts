import { route } from "../../lib/server";
import { getUserData } from "./loginUser";

export default route(async function({ req, user }) {
    return await getUserData(user);
}, { organizationNotRequired: true });