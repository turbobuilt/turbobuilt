import fetch from "node-fetch";
import "dotenv/config";
import { HttpError, route } from "lib/server";
import { generatePaypalAccessToken, handlePaypalResponse, paypalUrl } from "./paypal";
import { PaypalOrder } from "./PaypalOrder.model";
import { sendEmail } from "lib/sendEmail";


export default route(async function (params, orderID: string) {
    try {
        let [paypalOrder] = await PaypalOrder.fromQuery(`SELECT * FROM PaypalOrder WHERE paypalId=?`,[orderID]);

        if (!paypalOrder) {
            throw new HttpError(400, "That paypal order Id " + orderID + " was not found");
        }


        // use the cart information passed from the front-end to calculate the order amount detals
        const accessToken = await generatePaypalAccessToken();
        const url = `${paypalUrl}/v2/checkout/orders/${orderID}/capture`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                // "PayPal-Mock-Response": "mock_application_codes: CARD_EXPIRED"
                // Uncomment one of these to force an error for negative testing (in sandbox mode only).
                // Documentation:
                // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
                // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
            },
        });

        const { jsonResponse, httpStatusCode } = await handlePaypalResponse(response);
        if (jsonResponse.status === "COMPLETED") {
            paypalOrder.status = jsonResponse.status;
            await paypalOrder.save();
            sendEmail({
                to: ["dtruelson@icloud.com"], //['hdtruelson@gmail.com'], //"9724150547@txt.att.net"],
                from: "info@turbobuilt.com",
                subject: "Got a purchase!",
                html: `<div>A customer just made a purchase</div>
                    <pre>${JSON.stringify(paypalOrder, null, "\t")}</pre>
                `,
            }).catch(err => {
                console.error("Failed to send email", err);
            });
        }
        if (httpStatusCode.toString().startsWith("2")) {
            return jsonResponse;
        } else {
            console.log("WILL THROW capture error")
            throw new HttpError(httpStatusCode, JSON.stringify(jsonResponse), jsonResponse);
        }
    } catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        console.error("Failed to create order:", error);
        throw new HttpError(500, "Error doing paypal order. please contact support! " + error.message);
    }
}, { public: true });