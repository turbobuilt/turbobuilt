export class OrganizationInvitation extends DbObject {
    organization: string;
    email: string;
    name: string;
    token: string;
    inviteSent: boolean;
}
