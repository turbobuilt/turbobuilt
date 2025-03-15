// import tools from "..";
import { escape } from 'he';
import capturePaypalOrder from './capturePaypalOrder';
import createPaypalOrder from './createPaypalOrder';
import authorizePaypalOrder from './authorizePaypalOrder';

// function showError(message) {
//     let errorDiv = document.querySelector(".turbobuilt-paypal-error") as HTMLElement;
//     if (!errorDiv) {
//         errorDiv = document.createElement("div")
//         errorDiv.className = "turbobuilt-paypal-error";
//         Object.assign(errorDiv.style, {
//             position: "fixed",
//             "z-index": 1000,
//             top: "0",
//             left: "0",
//             right: "0",
//             background: "#d52b2b",
//             color: "white",
//             padding: "5px",
//             overflow: "auto",
//             display: "none",
//         })
//         let errorMessageDiv = document.createElement('div');
//         errorDiv.appendChild(errorMessageDiv);
//         let buttonDiv = errorDiv.querySelector("turbobuilt-paypal-error-close") as HTMLElement;
//         Object.assign(buttonDiv.style, {
//             border: "none",
//             background: "white",
//             "border-radius": "2px",
//             padding: "5px 10px",
//             cursor: "pointer",
//             margin: "0 auto",
//         });
//         buttonDiv.onclick = function () {
//             errorMessageDiv.innerHTML = "";
//             errorDiv.style.display = "none";
//         }
//         errorDiv.appendChild(buttonDiv);
//     }
//     let errorMessageDiv = document.createElement('div');
//     const escapedHtml = escape(message);
//     errorMessageDiv.innerHTML = escapedHtml;
// }

function loadScript(element, intent) {
    console.log("intent is", intent)
    return new Promise((resolve, reject) => {
        let currentScript = document.getElementById("paypal-sdk");
        if (!currentScript) {
            let liveKey = process.env.paypal_api_key
            // let paypalClientId = window.location.origin.includes("mysite") ? debugKey : liveKey;
            let paypalClientId = liveKey;

            let paypalUrl = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&components=buttons,applepay&enable-funding=venmo&disable-funding=credit,paylater${intent === "authorize" ? "&intent=authorize" : ""}`;
            let script = element.ownerDocument.createElement('script') as HTMLScriptElement;
            script.src = paypalUrl;
            script.id = "paypal-sdk";
            script.async = true;
            element.ownerDocument.head.appendChild(script);
            script.onload = () => {
                console.log("loaded paypal");
                resolve(null);
            };
        } else {
            resolve(null);
        }
    });
}

export default async function (params: { 
    element: HTMLElement,
    orderData: any, 
    intent: "authorize"|"capture",
    onError: (err?, details?) => void,
    onSuccess: (data, actions) => void
}) {
    let { element, orderData, intent } = params;
    console.log("loading paypal")
    await loadScript(element, intent);
    console.log("loaded paypal")


    let elementWindow = element.ownerDocument.defaultView as Window & typeof globalThis & { paypal: any };
    elementWindow.paypal.Buttons({
        style: {
            shape: "rect",
            layout: "vertical",
            color: "white",
            label: "paypal",
            tagline: false,
        },
        createOrder: async () => {
            try {
                let result = await createPaypalOrder(orderData)
                if (result.error) {
                    // showError(result.error);
                    params.onError(result.error, result.details);
                    return;
                }

                console.log(result.data);
                return result.data.id;
            } catch (error) {
                console.error(error);
            }
        },
        onCancel: async () => {

        },
        onError: async (err) => {
            console.error("Error in paypal transaction", err);
            // showError(typeof err === "string" ? err : JSON.stringify(err));
            params.onError(err);
        },
        onApprove: async (data, actions) => {
            try {
                console.log("Submitting approve");
                console.log("will sumit")
                let orderID = data.orderID
                let result;
                if (intent == "capture") {
                    result = await capturePaypalOrder(data.orderID);
                } else {
                    result = await authorizePaypalOrder(data.orderID);
                }
                console.log("got result", result);
                if (result.error) {
                    params.onError(result.error, result.details);
                    console.log("Details", result.details)
                    return;
                }
                if (result.data && result.data.status === "COMPLETED") {
                    
                } else {
                    params.onError(JSON.stringify(data), data);
                    return;
                    // showError("Received an unknown status code from paypal. Please contact support, as the transaction may or may not have gone through. Order ID is " + orderID + " details " + JSON.stringify(data));
                }
                console.log(result.data);
                params.onSuccess(data, actions)
                return;
            } catch (err) {
                console.error(err);
                params.onError(err)
                // showError(err.message || JSON.stringify(err));
            }
        },
    }).render(element);
}