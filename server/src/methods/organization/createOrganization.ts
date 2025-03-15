import { Website } from "methods/website/Website.model";
import db, { Db } from "../../lib/db";
import { Workspace } from "../workspace/Workspace.model";
import { Organization } from "./Organization.model";
import { getDomain } from "lib/getDomain";
import { WorkspaceFile } from "methods/workspace/WorkspaceFile.model";
import { UserOrganization } from "methods/userOrganization/UserOrganization.model";
import { ensureBuiltInItemPropertyTypesForOrganization } from "methods/itemPropertyType/getItemPropertyTypeList";
import { AppleSettings } from "methods/apple/AppleSettings.model";
import { StripeSettings } from "methods/payment/stripe/StripeSettings.model";

export async function createOrganization(owner: string, con?: Db, data?: { name: string }) {
    let work = async (con) => {
        let organization = await Organization.init({ name: data?.name || `Default`, owner: owner });
        await organization.save({ con });
        let userOrganization = await UserOrganization.init({ user: owner, organization: organization.guid });
        await userOrganization.save({ con });
        let workspace = await Workspace.init({ organization: organization.guid, name: "Default", identifier: organization.guid + "_default" });
        await workspace.save({ con });
        let rootDir = await WorkspaceFile.init({ organization: organization.guid, workspace: workspace.guid, path: "/", type: "dir" });
        await rootDir.save({ con });
        let appleSettings = new AppleSettings();
        appleSettings.organization = organization.guid;
        await appleSettings.save({ con });
        let stripeSettings = await StripeSettings.init({ organization: organization.guid });
        await stripeSettings.save({ con });
        await ensureBuiltInItemPropertyTypesForOrganization(organization.guid, con);
        // let testWebsite = await Website.init({ domain: getDomain(), organization: organization.guid, activated: false, name: "Test", isTest: true });
        // await testWebsite.save({ con });
        return organization;
    }
    if (!con) {
        return await db.transaction(work);
    } else {
        return await work(con);
    }
}