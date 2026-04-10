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
    case "checkout.session.completed": {
      // Fires for both Checkout Sessions and Payment Links
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const clientReferenceId = session.client_reference_id; // userId if set via checkout route
      const customerEmail = session.customer_details?.email;

      // Find or link the user
      let userId: string | null = null;

      // 1. Try client_reference_id (set by our checkout route)
      if (clientReferenceId) {
        userId = clientReferenceId;
      } else {
        // 2. Try to find by existing stripe_customer_id
        const { data: existing } = await serviceClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        if (existing) userId = existing.user_id;
      }

      // 3. Try to find by email if still no match
      if (!userId && customerEmail) {
        const { data: { users } } = await serviceClient.auth.admin.listUsers();
        const match = users?.find((u: any) => u.email === customerEmail);
        if (match) userId = match.id;
      }

      if (userId) {
        // Upsert subscription record
        await serviceClient.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: "premium",
          status: "active",
        }, { onConflict: "user_id" });

        // Set token balance to 200
        const { data: existing } = await serviceClient
          .from("token_balances")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (existing) {
          await serviceClient
            .from("token_balances")
            .update({ balance: 200 })
            .eq("user_id", userId);
        } else {
          await serviceClient.from("token_balances").insert({
            user_id: userId,
            balance: 200,
          });
        }

        await serviceClient.from("token_transactions").insert({
          user_id: userId,
          amount: 200,
          type: "purchase",
          description: "Premium subscription — 200 tokens",
        });

        console.log(`checkout.session.completed: upgraded userId=${userId}`);
      } else {
        console.warn(`checkout.session.completed: could not identify user. customer=${customerId} email=${customerEmail}`);
      }
      break;
    }

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
          })
          .eq("user_id", subRecord.user_id);

        if (isActive) {
          await serviceClient
            .from("token_balances")
            .update({ balance: 200 })
            .eq("user_id", subRecord.user_id);
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
