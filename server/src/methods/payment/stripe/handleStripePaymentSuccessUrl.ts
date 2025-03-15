import { ServerParams } from "lib/node-server";
import { stripe } from "./getStripe";
import { StripeSettings } from "./StripeSettings.model";

export async function handleStripePaymentSuccess(params: ServerParams) {
    let sessionId = params.req.url.match(/session_id=([^&]+)/)[1];
    let redirectUrl = params.req.url.match(/redirectUrl=([^&]+)/)[1];
    let organizationGuid = params.req.url.match(/organization=([^&]+)/)[1];

    let [stripeSettings] = await StripeSettings.fromQuery(`SELECT * FROM StripeSettings WHERE organization = ?`, [organizationGuid]);

    // check success
    let result = await stripe.checkout.sessions.retrieve(sessionId, { stripeAccount: stripeSettings.stripeAccountId });
    if (result.payment_status !== "paid") {
        throw new Error("payment not paid");
    }

    // redirect
    params.res.writeHead(302, {
        Location: redirectUrl
    });
    params.res.end();
}