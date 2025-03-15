import fetch from "node-fetch";
import "dotenv/config";
import path from "path";
import { HttpError, route } from "lib/server";
import { OrderData } from "methods/orderData/OrderData.model";
import { convertOrderDataToPaypalCart, generatePaypalAccessToken, handlePaypalResponse, paypalUrl } from "./paypal";
import { ShoppingCart } from "common/tools/cart/cart";
import { inspect } from "util";
import { PaypalOrder } from "./PaypalOrder.model";

export default route(async function (params, orderData: OrderData) {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { jsonResponse, httpStatusCode, payload } = await createOrder(orderData);
        if (httpStatusCode.toString().startsWith("2")) {
            let paypalOrder = new PaypalOrder();
            paypalOrder.paypalId = jsonResponse.id;
            paypalOrder.status = jsonResponse.status;
            paypalOrder.payload = payload;
            paypalOrder.orderData = orderData
            await paypalOrder.save();
            return jsonResponse;
        } else {
            throw new HttpError(httpStatusCode, JSON.stringify(jsonResponse));
        }
    } catch (error) {
        console.error("Failed to create order:", error);
        throw new HttpError(500, "Error doing paypal order. please contact support! " + error.message);
    }
}, { public: true });

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
async function createOrder(orderData: OrderData) {
    const accessToken = await generatePaypalAccessToken();
    const url = `${paypalUrl}/v2/checkout/orders`;
    const payload = convertOrderDataToPaypalCart(orderData)
    console.log("payload", inspect(payload, null, 10));

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only).
            // Documentation: https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
        method: "POST",
        body: JSON.stringify(payload),
    });
    console.log("Got response")
    let responseParsed = await handlePaypalResponse(response);
    let data = { ...responseParsed, payload };
    return data;
};