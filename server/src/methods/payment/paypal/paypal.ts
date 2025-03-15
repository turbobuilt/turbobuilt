import { ShoppingCart } from "common/tools/cart/cart";
import getGrandTotal from "common/tools/cart/totals/getGrandTotal";
import getLineItemTotal from "common/tools/cart/totals/getLineItemTotal";
import getSubtotal from "common/tools/cart/totals/getSubtotal";
import getTotalTax from "common/tools/cart/totals/getTotalTax";
import { Item } from "methods/item/Item.model";
import { OrderData } from "methods/orderData/OrderData.model";
import fetch from "node-fetch";
import { inspect } from "util";

export const paypalUrl = process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

// export const paypalUrl = "https://api-m.sandbox.paypal.com";


export async function generatePaypalAccessToken() {
    // To base64 encode your client id and secret using NodeJs
    const BASE64_ENCODED_CLIENT_ID_AND_SECRET = Buffer.from(
        `${process.env.paypal_client_id}:${process.env.paypal_client_secret}`
    ).toString("base64");
    console.log("paypal client id", `${process.env.paypal_client_id}:${process.env.paypal_client_secret}`)
    console.log("paypal url", paypalUrl)
    const request = await fetch(
        paypalUrl + "/v1/oauth2/token",
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${BASE64_ENCODED_CLIENT_ID_AND_SECRET}`,
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                response_type: "id_token",
                intent: "sdk_init",
            }),
        }
    );
    const text = await request.text();
    console.log("response text is", text);
    const json = JSON.parse(text);
    console.log("json is", json)
    return json.access_token;
} 

export function convertOrderDataToPaypalCart(orderData: OrderData) {
    let clientCart = orderData.cart;
    let shoppingCart = ShoppingCart.parse(clientCart);
    let cart =  {
        intent: "AUTHORIZE",
        purchase_units: [{
            items: shoppingCart.lineItems.map(lineItem => {
                return {
                    name: lineItem.item.name,
                    quantity: lineItem.quantity,
                    unit_amount: {
                        currency_code: "USD",
                        value: Math.floor(getLineItemTotal(lineItem) / lineItem.quantity*100)/100,
                    }
                }
            }),
            amount: {
                currency_code: "USD",
                value: getGrandTotal(clientCart),
                breakdown: {
                    item_total: {
                        currency_code: "USD",
                        value: getSubtotal(clientCart),
                    },
                    tax_total: {
                        currency_code: "USD",
                        value: getTotalTax(clientCart)
                    }
                }
            }
        }],
        payment_source: {
            name: "Test use",
            billing_address: {
                address_line_1: orderData.details?.shippingAddress?.line1,
                address_line_2: orderData.details?.shippingAddress?.line2,
                admin_area_2: orderData.details?.shippingAddress?.city,
                admin_area_1: orderData.details?.shippingAddress?.region,
                postal_code:  orderData.details?.shippingAddress?.postalCode,
                country_code: "US"
            },
            paypal: {
                address: {
                    address_line_1: orderData.details?.shippingAddress?.line1,
                    address_line_2: orderData.details?.shippingAddress?.line2,
                    admin_area_2: orderData.details?.shippingAddress?.city,
                    admin_area_1: orderData.details?.shippingAddress?.region?.toUpperCase(),
                    postal_code:  orderData.details?.shippingAddress?.postalCode,
                    country_code: "US"
                }
            }
        }
    }
    console.log(inspect(cart, null, 10))
    return cart;
}



export async function handlePaypalResponse(response) {
    let text = "";
    console.log("parsing response...")
    try {
        text = await response.text();
        const jsonResponse = JSON.parse(text);
        let data = {
            jsonResponse,
            httpStatusCode: response.status,
        };
        return data;
    } catch (err) {
        let errorMessage = err.message + " " + text;
        console.log("error message text is", errorMessage)
        throw new Error(errorMessage);
    }
}