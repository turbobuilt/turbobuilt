import { ShoppingCart } from "common/tools/cart/cart";
import getGrandTotal from "common/tools/cart/totals/getGrandTotal";
import { route } from "lib/server";
import { stripe } from "./getStripe";
import { StripeSettings } from "./StripeSettings.model";
import { Purchase } from "methods/purchase/Purchase.model";

export default route(async function (params, paymentMethodId: string, cart: ShoppingCart, details: any) {
    if (typeof paymentMethodId !== "string") {
        throw new Error("paymentMethodId must be a string");
    }
    let { total, currency } = await getGrandTotal(cart);
    let amount = Math.floor(total * 100);
    
    let organizationGuid = params.website?.organization || params.organization.guid;
    let [stripeSettings] = await StripeSettings.fromQuery(`SELECT * FROM StripeSettings WHERE organization = ?`, [organizationGuid]);

    // make sure details not over 50k chars
    if (JSON.stringify(details).length > 50000) {
        throw new Error("Details too long, greater than 50k characters");
    }
    // delete all on item except for guid
    for (let lineItem of cart.lineItems) {
        for (let key in lineItem.item) {
            if (key !== "guid") {
                delete lineItem[key];
            }
        }
    }
    // make sure cart not over 50k chars
    if (JSON.stringify(cart).length > 50000) {
        throw new Error("Cart too long, greater than 50k characters");
    }
    
    let purchase = new Purchase();
    purchase.organization = organizationGuid;
    purchase.website = params.website?.guid;
    purchase.cart = cart;
    purchase.details = details;
    purchase.state = "created";
    purchase.total = total;
    await purchase.save();

    // charge the card
    let paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never"
        },
        // receipt_email: details.email,
        on_behalf_of: stripeSettings.stripeAccountId,
    });
    // let charge = await stripe.charges.create({
    //     amount: amount,
    //     currency: currency,
    //     source: paymentMethodId,
    //     on_behalf_of: stripeSettings.stripeAccountId,
    // });

    purchase.state = paymentIntent.status;
    await purchase.save();

    return { status: paymentIntent.status };
}, { public: true });