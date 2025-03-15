export class StripeSettings extends DbObject {
    stripeAccountId?: string;
    complete?: boolean;
    organization: string;
}
