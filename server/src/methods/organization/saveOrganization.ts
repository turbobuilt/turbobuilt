import db from "lib/db";
import { HttpError, route } from "../../lib/server";
import { createOrganization } from "./createOrganization";
import { Organization } from "./Organization.model";

export default route(async function (params, clientItem: Organization) {
    if (!clientItem.name) {
        throw new HttpError(400, "name is required");
    }
    if (!clientItem.guid) {
        let organization = await createOrganization(params.user.guid, null, { name: clientItem.name });
        return organization;
    }
    
    let [organization] = await Organization.fromQuery(`SELECT Organization.*
        FROM Organization
        JOIN UserOrganization ON Organization.guid = UserOrganization.organization
        WHERE Organization.guid = ? AND UserOrganization.user = ?`, [clientItem.guid, params.user.guid]);
    
    if (!organization) {
        throw new HttpError(404, "organization not found, or you are not registered as a user of this organization");
    }

    try {
        // Object.assign(organization, clientItem);
        organization.name = clientItem.name;
        let result = await organization.save();
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            throw new HttpError(409, "workspace with that identifier already exists");
        }
        throw err;
    }
    return organization;
})