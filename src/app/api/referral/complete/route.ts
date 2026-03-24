import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();

    // Find pending referral for this user
    const { data: referral } = await serviceClient
      .from("referrals")
      .select("*")
      .eq("referred_id", user.id)
      .eq("status", "pending")
      .single();

    if (!referral) {
      return NextResponse.json({ message: "No pending referral found" });
    }

    // Mark referral as completed
    await serviceClient
      .from("referrals")
      .update({ status: "completed", reward_issued: true })
      .eq("id", referral.id);

    // Award +30 tokens to referrer
    const { data: referrerBalance } = await serviceClient
      .from("token_balances")
      .select("balance")
      .eq("user_id", referral.referrer_id)
      .single();

    if (referrerBalance) {
      await serviceClient
        .from("token_balances")
        .update({ balance: referrerBalance.balance + 30 })
        .eq("user_id", referral.referrer_id);

      await serviceClient.from("token_transactions").insert({
        user_id: referral.referrer_id,
        amount: 30,
        type: "referral_reward",
        description: "Referral reward — friend completed first analysis",
      });
    }

    return NextResponse.json({ success: true, tokensAwarded: 30 });
  } catch (err) {
    console.error("Referral complete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
