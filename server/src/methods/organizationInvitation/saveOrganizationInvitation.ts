import { HttpError, route } from "lib/server";
import { OrganizationInvitation } from "./OrganizationInvitation.model";
import { UserOrganization } from "methods/userOrganization/UserOrganization.model";
import { randomBytes } from "crypto";
import { sendEmail } from "lib/sendEmail";
import { Organization } from "methods/organization/Organization.model";
import db from "lib/db";

export default route(async function (params, organizationGuid: string, email: string, name?: string) {
    // make suer user is part of organization
    let [organization] = await db.query(`SELECT Organization.*, UserOrganization.user as associatedUser
        FROM Organization
        LEFT JOIN UserOrganization ON Organization.guid = UserOrganization.organization
        WHERE Organization.guid = ?`, [organizationGuid]);
    if (!organization) {
        return new HttpError(400, 'Organization not found or you do not have access to this organization');
    }
    let [organizationInvitation] = await OrganizationInvitation.fromQuery(`SELECT OrganizationInvitation.*
        FROM OrganizationInvitation
        WHERE OrganizationInvitation.organization = ? AND OrganizationInvitation.email = ?`, [params.organization.guid, email]);
    if (organizationInvitation) {
        throw new HttpError(400, 'Invitation already exists');
    }
    let [userOrganization] = await UserOrganization.fromQuery(`SELECT UserOrganization.*
        FROM UserOrganization
        JOIN User ON User.guid = UserOrganization.user
        WHERE User.email = ? AND UserOrganization.organization = ?`, [email, params.organization.guid]);
    if (userOrganization) {
        throw new HttpError(400, 'User already belongs to this organization');
    }
    organizationInvitation = new OrganizationInvitation();
    organizationInvitation.organization = organizationGuid;
    organizationInvitation.email = email;
    organizationInvitation.name = name;
    organizationInvitation.token = randomBytes(256/8).toString('hex');
    console.log('organizationInvitation', organizationInvitation);
    await organizationInvitation.save();
    sendInvitationEmail(organizationInvitation, organizationGuid);
    delete organizationInvitation.token;
    return organizationInvitation;
});

async function sendInvitationEmail(organizationInvitation: OrganizationInvitation, organizationGuid: string) {
    let [organization] = await Organization.fromQuery(`SELECT * FROM Organization WHERE guid = ?`, [organizationGuid]);
    let origin = process.env.NODE_ENV === 'production' ? 'https://portal.turbobuilt.com' : 'http://localhost:8081';
    let acceptUrl = `${origin}/#/?invitation-token=${organizationInvitation.token}`;
    sendEmail({
        to: organizationInvitation.email,
        from: "invite@turbobuilt.com",
        subject: `Invitation to join ${organization.name}`,
        template: "invite-to-organization",
        data: {
            organization: organization.name,
            acceptUrl: acceptUrl
        }
    }).then(() => {
        organizationInvitation.inviteSent = true;
        organizationInvitation.save();
    }).catch(e => {
        console.error('error sending email or saving the result', e);
    });
}