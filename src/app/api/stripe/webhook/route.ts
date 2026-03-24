import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const serviceClient = await createServiceClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: subRecord } = await serviceClient
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (subRecord) {
        const isActive = sub.status === "active" || sub.status === "trialing";
        await serviceClient
          .from("subscriptions")
          .update({
            stripe_subscription_id: sub.id,
            plan: isActive ? "premium" : "free",
            status: sub.status,
            current_period_end: null, // current_period_end removed in Stripe API v2026+
          })
          .eq("user_id", subRecord.user_id);

        // Boost token balance for new premium users
        if (isActive) {
          await serviceClient
            .from("token_balances")
            .update({ balance: 200 })
            .eq("user_id", subRecord.user_id);

          await serviceClient.from("token_transactions").insert({
            user_id: subRecord.user_id,
            amount: 200,
            type: "purchase",
            description: "Premium subscription — 200 tokens",
          });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: subRecord } = await serviceClient
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (subRecord) {
        await serviceClient
          .from("subscriptions")
          .update({ plan: "free", status: "cancelled" })
          .eq("user_id", subRecord.user_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
