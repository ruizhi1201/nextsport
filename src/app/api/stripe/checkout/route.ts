import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Accept JWT token from mobile app (in body) OR from cookie session
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (body.access_token) {
      // Mobile path: validate JWT directly
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user }, error } = await supabase.auth.getUser(body.access_token);
      if (error || !user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      userId = user.id;
      userEmail = user.email ?? null;
    } else {
      // Web path: use cookie session
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
      userEmail = user.email ?? null;
    }

    const serviceClient = await createServiceClient();

    // Get or create Stripe customer
    const { data: subscription } = await serviceClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail ?? undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await serviceClient.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        plan: "free",
        status: "active",
      });
    }

    const appUrl = "https://nextsport-six.vercel.app";
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID!;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${appUrl}/pricing?success=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { user_id: userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
