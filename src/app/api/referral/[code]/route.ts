import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const serviceClient = await createServiceClient();

  const { data: profile, error } = await serviceClient
    .from("profiles")
    .select("id, player_name, referral_code")
    .eq("referral_code", code)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  return NextResponse.json({
    referrerId: profile.id,
    referrerName: profile.player_name || "A friend",
    code: profile.referral_code,
  });
}
