import Stripe from 'stripe';

export const stripe = new Stripe(process.env.stripe_secret, {
    // apiVersion: '2020-08-27',
});