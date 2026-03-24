import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || "price_placeholder";
export const PREMIUM_PRICE = 14.99;
