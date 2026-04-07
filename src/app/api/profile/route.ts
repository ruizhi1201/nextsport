import { NextRequest, NextResponse } from "next/server";
import { createMobileClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createMobileClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();

  // Fetch profile and token balance in parallel
  const [profileRes, tokenRes] = await Promise.all([
    serviceClient.from("profiles").select("*").eq("id", user.id).single(),
    serviceClient.from("token_balances").select("balance").eq("user_id", user.id).single(),
  ]);

  if (profileRes.error && profileRes.error.code !== "PGRST116") {
    return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
  }

  const profile = profileRes.data ?? {};
  const tokens_remaining = tokenRes.data?.balance ?? 10;

  // Return a flat profile object the mobile app expects
  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: profile.player_name ?? null,
    avatar_url: null,
    tokens_remaining,
    subscription_status: profile.subscription_status ?? "free",
    token_reset_date: null,
    referral_code: profile.referral_code ?? null,
    // Extra fields
    age_group: profile.age_group ?? null,
    level: profile.level ?? null,
    sport: profile.sport ?? "baseball",
    onboarding_completed: profile.onboarding_completed ?? false,
  });
}
