import { route } from "lib/server";
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys

import { StripeSettings } from "./StripeSettings.model";
import { Organization } from "methods/organization/Organization.model";
import Stripe from "stripe";
import { stripe } from "./getStripe";



export default route(async function (params, organizationId: string) {
    // make sure they have access
    let [organization] = await Organization.fromQuery(`SELECT Organization.*
        FROM Organization
        JOIN UserOrganization ON (UserOrganization.organization = Organization.guid AND UserOrganization.user = ?)
        WHERE Organization.guid = ?`, [params.user.guid, organizationId]);
    if (!organization) {
        throw new Error("Organization not found or user does not have access");
    }

    let [stripeSettings] = await StripeSettings.fromQuery(`SELECT * FROM StripeSettings WHERE organization = ?`, [params.organization.guid]);
    let account: Stripe.Account;
    if(!stripeSettings) {
        account = await stripe.accounts.create();
        stripeSettings = await StripeSettings.init({
            organization: organization.guid,
            complete: false,
            stripeAccountId: account.id
        });
        await stripeSettings.save();
    } else {
        account = await stripe.accounts.retrieve(stripeSettings.stripeAccountId);
        if (account.details_submitted) {
            throw new Error("Stripe account already has details submitted");
        }
    }
    const refreshUrl = `${process.env.portal_url}/#/organization/${organization.guid}?stripe_refresh=true`;
    console.log("refreshUrl", refreshUrl);
    const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: refreshUrl,
        return_url: `${process.env.portal_url}/#/organization/${organization.guid}?stripe_return=true`,
        type: 'account_onboarding',
        collection_options: {
          fields: 'eventually_due',
        },
    });
    return { url: accountLink.url };
});