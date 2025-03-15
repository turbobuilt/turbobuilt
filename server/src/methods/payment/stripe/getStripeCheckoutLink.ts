import { route } from "lib/server";
import { StripeSettings } from "./StripeSettings.model";
import { stripe } from "./getStripe";
import { ShoppingCart } from "common/tools/cart/cart";
import getLineItemTotal from "common/tools/cart/totals/getLineItemTotal";
import { getHydratedItems, HydratedItem } from "methods/item/publicGetItemList";
import Stripe from "stripe";

export default route(async function (params, cart: ShoppingCart, redirectUrl: string, email?:string) {
    console.log("website is", params.website);
    console.log("organization is", params.organization);
    let organizationGuid = params.organization?.guid || params.website?.organization;
    if (!organizationGuid) {
        throw new Error("organization or website must be provided");
    }
    let [stripeSettings] = await StripeSettings.fromQuery(`SELECT * FROM StripeSettings WHERE organization = ?`, [organizationGuid]);
    if (!stripeSettings) {
        throw new Error("Stripe settings not found for organization");
    }
    if (!stripeSettings.stripeAccountId) {
        throw new Error("Stripe account id not found for organization");
    }
    if (!stripeSettings.complete) {
        throw new Error("Stripe settings are not complete for organization");
    }
    console.log("items", cart.lineItems[0]);
    let items = await getHydratedItems(organizationGuid, { guids: cart.lineItems.map(val => val.item.guid) });
    for (let lineItem of cart.lineItems) {
        lineItem.item = items.find(serverItem => serverItem.guid === lineItem.item.guid);
    }

    const lineItems = await Promise.all(cart.lineItems.map(async lineItem => {
        const total = getLineItemTotal(lineItem);
        let item = lineItem.item as HydratedItem;
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    description: "An adorable cavapoo",
                    images: item.imageUrls,
                    metadata: {
                        itemGuid: item.guid,
                        organizationGuid: organizationGuid,
                        websiteGuid: params.website?.guid,
                    }
                },
                unit_amount: Math.floor(total / lineItem.quantity * 100),
            },
            quantity: lineItem.quantity,
        } as Stripe.Checkout.SessionCreateParams.LineItem;
    }));

    // const paymentIntent = await stripe.paymentIntents.create({
    //     amount: lineItems.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0),
    //     currency: 'usd',
    //     // authorize only
    //     capture_method: 'manual',
    //     // payment_method_types: ['card'],
    //     application_fee_amount: 0,
    //     automatic_payment_methods: {
    //         enabled: true,
    //     }
    // }, {
    //     stripeAccount: stripeSettings.stripeAccountId,
    // });
    // return { secret: paymentIntent.client_secret };
    // cs_test_a1KsvpoEtVL50KNqg6mz1rzKl3RnFmjMIjWUXwds39tVf0JMmHnI2VkQQ0
    const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        customer_email: email,
        phone_number_collection: {
            enabled: true,
        },
        success_url: `${process.env.portal_url}/stripe-payment-success?redirectUrl=${encodeURIComponent(redirectUrl)}&organization=${organizationGuid}&session_id={CHECKOUT_SESSION_ID}`,
    }, {
        stripeAccount: stripeSettings.stripeAccountId,
    });
    return { url: session.url };
}, { public: true });