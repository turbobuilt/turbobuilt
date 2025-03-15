import { IncomingMessage } from "http";
import { Organization } from "../methods/organization/Organization.model";
import { User } from "../methods/user/models/User.model";
import db from "./db";

export async function auth(req: IncomingMessage) {
    let token = req.headers.authorization;
    let organizationId = req.headers['organization-id'];
    if (!token) {
        return false;
    }
    let [users, organizations] = await Promise.all([
        User.fromQuery(`SELECT User.* FROM User JOIN AuthToken ON User.guid = AuthToken.user WHERE AuthToken.token = ?`, [token]),
        Organization.fromQuery(`SELECT Organization.* 
            FROM Organization
            JOIN UserOrganization ON Organization.guid = UserOrganization.organization
            JOIN AuthToken ON UserOrganization.user = AuthToken.user
            WHERE AuthToken.token = ? AND Organization.guid = ?`, [token, organizationId])
    ]) as [User[], Organization[]];

    return { user: users[0], organization: organizations[0] };
}