import callMethod from "../../../../../client/src/lib/callMethod";
import { ShoppingCart } from "../cart/cart";
import getGrandTotal from "../cart/totals/getGrandTotal";

const livePublicToken = "pk_live_51JEIXQKQlgzQQuyifh0i96DauOzly8XZO7WRAd2CFQdASW3njxxdaojxbeojdBudrSNmaPxJPZwQCvIujEdiVEc5008GlrLMh2";
const testPublicToken = "pk_test_51JEIXQKQlgzQQuyipmwUlPksGPQKUTJfMIiWm25ny4z4pPnugXxCcqgHoU2zfrbFmrIqVHDJGy5tfuZ4VId0uWV700LGvwkDa8";
const stripeToken = window.location.origin.includes('localhost') ? testPublicToken : livePublicToken;

declare global {
    interface Window {
        Stripe: any;
    }
};
function showAlert(message: string, options?: { color?: 'success' | 'error' | 'warning', hideAfter?: number }) {
    const alertBox = document.createElement('div');
    const backgroundColor = options?.color === 'success' ? 'rgb(40 167 69)' :
        options?.color === 'warning' ? 'rgb(255 193 7)' :
            options?.color === 'error' ? 'rgb(160 12 25)' :
                'rgb(160 12 25)';
    Object.assign(alertBox.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        backgroundColor,
        color: 'white',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        zIndex: '9999',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
    });
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    alertBox.addEventListener('click', () => {
        if (alertBox)
            alertBox.remove();
    });
    setTimeout(() => {
        if (alertBox)
            alertBox.remove();
    }, options?.hideAfter ?? 20000);
}

export default async function (element: HTMLElement, cart: ShoppingCart, details, callback: () => void) {
    if (!element) {
        showAlert("element is required for showStripeCheckout");
        return;
    }

    if (!document.getElementById('stripe-js')) {
        let script = document.createElement('script');
        script.id = 'stripe-js';
        script.src = 'https://js.stripe.com/v3/';
        document.head.appendChild(script);
    }
    if (!document.getElementById('stripe-checkout-css')) {
        let content = `
        .payment-spinner {
            margin: 0 auto;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%; 
            width: 20px; 
            height: 20px; 
            animation: payment-spin .7s linear infinite;
        }
        @keyframes payment-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .pay-now-button {
            padding: 10px;
            width: 100%;
            margin-top: 3px;
            margin-bottom: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
        }
        .pay-now-button:disabled {
            opacity: 0.5;
        }`;
        let style = document.createElement('style');
        style.id = 'stripe-checkout-css';
        style.textContent = content;
        document.head.appendChild(style);
    }
    for (let i = 0; i < 20; i++) {
        if (window.Stripe) break;
        await new Promise(res => setTimeout(res, 1000));
    }
    if (!window.Stripe) {
        showAlert("Stripe payment processing failed to load. Contact support for assistance.");
        return;
    }
    // unmount if necessary
    if (element.children.length) {
        element.innerHTML = '';
    }
    let cardElement = document.createElement('div');
    cardElement.id = 'card-element';
    Object.assign(cardElement.style, {
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '10px',
    });
    element.appendChild(cardElement);

    const { total, currency, currencySymbol } = getGrandTotal(cart);

    const stripe = window.Stripe(stripeToken);
    const options = {
        mode: 'payment',
        amount: total * 100,
        currency: currency,
    };
    const elements = stripe.elements(options);
    const card = elements.create('card');
    card.mount(cardElement);

    card.on('change', function (event) {
        if (!event.complete) {
            return;
        }
        submitButton.disabled = false;
    });

    // remove if exists
    if (element.querySelector('button')) {
        element.querySelector('button').remove();
    }
    const submitButton = document.createElement('button');
    const buttonText = `Reserve for ${currencySymbol}${total}`;
    submitButton.textContent = buttonText;
    submitButton.classList.add('pay-now-button');
    submitButton.addEventListener('click', async function () {
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<div class="payment-spinner"></div>';
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: card,
            });
            if (error) {
                showAlert(error.message);
            } else {
                console.log("paymentMethod", paymentMethod, "cart", cart, "details", details);
                const response = await callMethod('payment.stripe.chargeCardForCart', [paymentMethod.id, cart, details]);
                if (response.error) {
                    showAlert(response.error);
                    return;
                } else {
                    if (response.data.status !== "succeeded") {
                        showAlert("Payment status was not 'succeeded'. Please contact support. support@turbobuilt.com");
                        return;
                    } else {
                        showAlert("Payment successful", { color: 'success' });
                        // delete button
                        submitButton.remove();
                        callback();
                    }
                }
            }
        } catch (error) {
            console.error(error);
            showAlert("Error: " + error.message);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = buttonText;
            }
        }
    });
    // append after card element
    cardElement.after(submitButton);
    // make disabled if no card
    submitButton.disabled = true;
    return;
    // add hr
    const hr = document.createElement('hr');
    Object.assign(hr.style, {
        margin: '10px 0',
        border: 'none',
        borderTop: '1px solid #ccc',
    });
    element.appendChild(hr);
    // now mount express checkout
    const express = document.createElement('div');
    express.id = 'express-checkout';
    element.appendChild(express);

    const expressCheckoutElement = elements.create('expressCheckout');
    expressCheckoutElement.mount(express);

    expressCheckoutElement.on('confirm', onConfirm);

    function onConfirm(event) {
        const stripe = window.Stripe(stripeToken);

        // call Stripe function to initiate payment confirmation
        stripe.confirmPayment({
            elements,
            // clientSecret,
            confirmParams: {
                return_url: 'https://example.com',
            },
        }).then(function (result) {
            if (result.error) {
                // Inform the customer that there's an error.
            }
        });
    }
}