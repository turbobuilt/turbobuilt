import db from "lib/db";
import { DbObject } from "lib/DbObject.model";
import { foreign } from "lib/schema";
import { Organization } from "methods/organization/Organization.model";


export class UserState extends DbObject {
    @foreign({ onDelete: 'cascade', onUpdate: 'cascade', notNull: true })
    user: string;
    
    @foreign({ type: () => Organization, onDelete: "set null", onUpdate: "cascade", notNull: false })
    currentOrganization?: string;

    static async getForUser?(guid: string) : Promise<UserState> {
        let [data] = await db.query(`SELECT * FROM UserState WHERE user = ?`, [guid]);
        if (!data) {
            let userState = new UserState();
            userState.user = guid;
            let [organization] = await Organization.fromQuery(`SELECT Organization.guid 
                FROM Organization
                JOIN UserOrganization ON Organization.guid = UserOrganization.organization
                ORDER BY Organization.created LIMIT 1`);
            userState.currentOrganization = organization.guid;
            await userState.save();
            return userState;
        }
        return this.init(data);
    }
}