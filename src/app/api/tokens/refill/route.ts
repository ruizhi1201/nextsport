import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Simple auth check via cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();

  // Get all users with their subscription plan
  const { data: users, error } = await serviceClient
    .from("token_balances")
    .select(`
      user_id,
      balance,
      subscriptions!inner(plan, status)
    `);

  if (error) {
    console.error("Refill error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  let refilled = 0;

  for (const user of users || []) {
    const sub = Array.isArray(user.subscriptions) ? user.subscriptions[0] : user.subscriptions;
    const isPremium = sub?.plan === "premium" && sub?.status === "active";
    const weeklyTokens = isPremium ? 200 : 10;

    await serviceClient
      .from("token_balances")
      .update({
        balance: weeklyTokens,
        last_refill_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.user_id);

    await serviceClient.from("token_transactions").insert({
      user_id: user.user_id,
      amount: weeklyTokens,
      type: "weekly_refill",
      description: `Weekly token refill (${isPremium ? "Premium" : "Free"})`,
    });

    refilled++;
  }

  return NextResponse.json({ success: true, usersRefilled: refilled });
}
