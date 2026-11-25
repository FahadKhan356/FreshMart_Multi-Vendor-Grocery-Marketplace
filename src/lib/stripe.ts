import Stripe from "stripe";

// Initialize Stripe server instance
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_for_freshmart_stripe_payments";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-11-18.endive" as any,
  typescript: true,
  appInfo: {
    name: "FreshMart Multi-Vendor Marketplace",
    version: "1.0.0",
  },
});
