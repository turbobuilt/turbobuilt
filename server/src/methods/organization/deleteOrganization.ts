import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { Organization } from "./Organization.model";

export default route(async function (params, guid: string) {
    let [organization] = await Organization.fromQuery(`SELECT * FROM Organization WHERE guid=?`, [guid]);
    if (!organization) {
        throw new HttpError(400, "That item property doesn't exist within this organization. It may not even exist at all!");
    }
    if (organization.owner !== params.user.guid) {
        throw new HttpError(403, "You can't delete this if you are not the owner.");
    }
    await db.query(`DELETE FROM Organization WHERE guid=?`, [guid])
    return organization;
});