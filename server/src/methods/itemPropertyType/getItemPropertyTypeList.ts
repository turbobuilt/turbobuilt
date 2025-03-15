import { createGuid } from "lib/base58";
import db from "../../lib/db";
import { route } from "../../lib/server";
import { ItemPropertyType } from "./ItemPropertyType.model";

export const builtIns = [
    { name: "Images" },
    { name: "Text" },
    { name: "Number" },
    { name: "RichText" },
    { name: "PriceTable" }
]
let all = new Set(builtIns.map(item => item.name));

export async function ensureBuiltInItemPropertyTypes() {
    let organizationResults = await db.query(`SELECT guid FROM Organization`);
    organizationResults.map(async result => {
        let organization = result.guid;
        await ensureBuiltInItemPropertyTypesForOrganization(organization, db);
    });
}

export async function ensureBuiltInItemPropertyTypesForOrganization(organizationGuid: string, con) {
    // insert, on duplicate key update
    await Promise.all(builtIns.map(async item => {
        await con.query(`INSERT INTO ItemPropertyType (guid, organization, builtIn, name)
            VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name`,
        [await createGuid(), organizationGuid, 1, item.name]);
    }));
}

export default route(async function (params, options = { page: 1, perPage: 15, omitBuiltIn: false }) {
    let { page, perPage, omitBuiltIn } = options;
    let itemPropertyTypes = await db.query(`SELECT * FROM ItemPropertyType
        WHERE organization = ?
        ${omitBuiltIn ? "AND builtIn <> 1" : ""}
        ORDER BY builtIn DESC, name
        LIMIT ? OFFSET ?`, [params.organization.guid, perPage, (page - 1) * perPage]) as ItemPropertyType[];

    return { itemPropertyTypes };
});