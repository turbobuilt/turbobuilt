import fetch from "node-fetch";
import "dotenv/config";
import path from "path";
import { HttpError, route } from "lib/server";
import { OrderData } from "methods/orderData/OrderData.model";
import { convertOrderDataToPaypalCart, generatePaypalAccessToken, handlePaypalResponse, paypalUrl } from "./paypal";
import { instanceOf } from "@sebastianwessel/quickjs/dist/commonjs/sync/vmutil";
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
        const url = `${paypalUrl}/v2/checkout/orders/${orderID}/authorize`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const { jsonResponse, httpStatusCode } = await handlePaypalResponse(response);
        if (jsonResponse.status === "COMPLETED") {
            paypalOrder.status = jsonResponse.status;
            await paypalOrder.save();
            // send email to 9724150547@txt.att.net
            sendEmail({
                to: ["dtruelson@icloud.com"], //['hdtruelson@gmail.com'], //"9724150547@txt.att.net"],
                from: "info@turbobuilt.com.com",
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