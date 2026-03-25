import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const refCode = searchParams.get("ref") || "";

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;

      // Handle referral code for Google OAuth signups
      if (refCode) {
        const serviceClient = await createServiceClient();

        // Look up the referrer by code
        const { data: referrer } = await serviceClient
          .from("profiles")
          .select("id")
          .eq("referral_code", refCode)
          .single();

        if (referrer && referrer.id !== user.id) {
          // Check if a referral record already exists to avoid duplicates
          const { data: existingReferral } = await serviceClient
            .from("referrals")
            .select("id")
            .eq("referred_id", user.id)
            .single();

          if (!existingReferral) {
            // Update new user's profile with referred_by
            await serviceClient
              .from("profiles")
              .update({ referred_by: referrer.id })
              .eq("id", user.id);

            // Create pending referral record
            await serviceClient.from("referrals").insert({
              referrer_id: referrer.id,
              referred_id: user.id,
              status: "pending",
              reward_issued: false,
            });
          }
        }
      }

      // Pass ref code through to onboarding if present
      const redirectUrl = refCode && next.includes("onboarding")
        ? `${origin}${next}&ref=${refCode}`
        : `${origin}${next}`;

      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
