import { StripeSettings } from "methods/payment/stripe/StripeSettings.model";
import db from "../../lib/db";
import { HttpError, route } from "../../lib/server";
import { Organization } from "./Organization.model";

export default route(async function (params, guid: string) {
    const [[organization], [stripeSettings]] = await Promise.all([
        (Organization.fromQuery(`SELECT Organization.*, UserOrganization.user as associatedUser
            FROM Organization
            LEFT JOIN UserOrganization ON Organization.guid = UserOrganization.organization
            WHERE Organization.guid = ?`, [guid]) as Promise<(Organization & { associatedUser: string })[]>),
        StripeSettings.fromQuery(`SELECT StripeSettings.*
            FROM Organization
            JOIN UserOrganization ON (UserOrganization.organization = Organization.guid AND UserOrganization.user = ?)
            JOIN StripeSettings ON (StripeSettings.organization = Organization.guid)
            WHERE Organization.guid = ?`, [params.user.guid, guid])
    ]);

    if (!organization) {
        throw new HttpError(400, 'Organization not found');
    }
    if (!organization.associatedUser) {
        throw new HttpError(403, 'You do not have access to this organization');
    }
    return { organization, stripeOnboardingComplete: stripeSettings?.complete };
});