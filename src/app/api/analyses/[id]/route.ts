import { NextRequest, NextResponse } from "next/server";
import { createMobileClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });

    const analysis = {
      ...data,
      score: null,
      feedback: data.raw_analysis,
      audio_url: null,
      video_url: null,
      strengths: typeof data.strengths === "string" ? JSON.parse(data.strengths) : (data.strengths || []),
      improvements: typeof data.improvements === "string" ? JSON.parse(data.improvements) : (data.improvements || []),
      recommended_drills: typeof data.recommended_drills === "string" ? JSON.parse(data.recommended_drills) : (data.recommended_drills || []),
    };

    return NextResponse.json(analysis);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
