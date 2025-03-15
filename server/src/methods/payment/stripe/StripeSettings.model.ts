import { DbObject } from "lib/DbObject.model";
import { bit, foreign, json, varchar } from "lib/schema";
import { OrderData } from "methods/orderData/OrderData.model";
import { Organization } from "methods/organization/Organization.model";

export class StripeSettings extends DbObject {
    @varchar(255)
    stripeAccountId?: string;

    @bit()
    complete?: boolean;

    @foreign({ type: () => Organization, onDelete: "cascade", onUpdate: "cascade", notNull: true })
    organization: string;
}