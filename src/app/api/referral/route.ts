import { NextRequest, NextResponse } from "next/server";
import { createMobileClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createMobileClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();

  // Get referral code from profiles
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Count how many users were referred by this user
  const { count, error: countError } = await serviceClient
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", profile?.referral_code ?? "");

  return NextResponse.json({
    referral_code: profile?.referral_code ?? null,
    referral_count: count ?? 0,
    referred_count: count ?? 0,
    referral_link: `https://nextsport.vercel.app/signup?ref=${profile?.referral_code ?? ""}`,
  });
}
