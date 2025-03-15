import { route } from "lib/server";
import { stripe } from "./getStripe";
import { Organization } from "methods/organization/Organization.model";
import { StripeSettings } from "./StripeSettings.model";

export default route(async function (params, organizationGuid: string) {
    // make sure they have access
    let [stripeSettings] = await StripeSettings.fromQuery(`SELECT StripeSettings.*
            FROM Organization
            JOIN UserOrganization ON (UserOrganization.organization = Organization.guid AND UserOrganization.user = ?)
            JOIN StripeSettings ON (StripeSettings.organization = Organization.guid)
            WHERE Organization.guid = ?`, [params.user.guid, organizationGuid]);
    if (!stripeSettings) {
        throw new Error("Organization not found or user does not have access");
    }

    let account = await stripe.accounts.retrieve(stripeSettings.stripeAccountId);
    stripeSettings.complete = account.details_submitted;
    await stripeSettings.save();

    return { complete: stripeSettings.complete };
});