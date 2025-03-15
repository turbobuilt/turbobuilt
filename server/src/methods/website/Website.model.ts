import { WebsiteDomain } from "methods/websiteDomain/WebsiteDomain.model";
import { DbObject } from "../../lib/DbObject.model";
import { bit, foreign, text, varchar } from "../../lib/schema";
import { Organization } from "../organization/Organization.model";

export class Website extends DbObject {
    @varchar(255)
    name: string;

    @varchar(255)
    domain: string;

    @foreign({ type: () => Organization, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    organization: string;

    @bit()
    activated: boolean;

    @bit()
    isTest?: boolean;

    static async getByDomain(domain?: string) {
        let [website] = await Website.fromQuery(`SELECT * FROM Website WHERE domain=?`, [domain])
        return website;
    }
}