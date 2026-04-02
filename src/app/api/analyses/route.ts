import { NextRequest, NextResponse } from "next/server";
import { createMobileClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createMobileClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await serviceClient
      .from("swing_analyses")
      .select("id, status, swing_count, strengths, improvements, recommended_drills, raw_analysis, created_at, tokens_used")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const analyses = (data || []).map((a: any) => ({
      ...a,
      score: null,
      feedback: a.raw_analysis,
      audio_url: null,
      video_url: a.video_url || null,
      strengths: typeof a.strengths === "string" ? JSON.parse(a.strengths) : (a.strengths || []),
      improvements: typeof a.improvements === "string" ? JSON.parse(a.improvements) : (a.improvements || []),
      recommended_drills: typeof a.recommended_drills === "string" ? JSON.parse(a.recommended_drills) : (a.recommended_drills || []),
    }));

    return NextResponse.json(analyses);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { createClient } from "@supabase/supabase-js";
