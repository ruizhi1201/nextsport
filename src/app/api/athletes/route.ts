import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = await createServiceClient();
  const { data: athletes, error } = await serviceClient
    .from("athletes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(athletes || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, age_group, level, sport } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const serviceClient = await createServiceClient();

  // Check athlete limit (free: 3, premium: unlimited)
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single()
    .catch(() => ({ data: null }));

  const isPremium = profile?.subscription_status === "premium";
  if (!isPremium) {
    const { count } = await serviceClient
      .from("athletes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count || 0) >= 3) {
      return NextResponse.json({ error: "Free plan allows up to 3 athletes. Upgrade to Premium for unlimited." }, { status: 403 });
    }
  }

  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const { count: existingCount } = await serviceClient
    .from("athletes").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const avatar_color = colors[(existingCount || 0) % colors.length];

  const { data: athlete, error } = await serviceClient
    .from("athletes")
    .insert({ user_id: user.id, name: name.trim(), age_group, level, sport: sport || "baseball", avatar_color })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(athlete, { status: 201 });
}
