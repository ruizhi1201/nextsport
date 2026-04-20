import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMobileClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createMobileClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const athleteId = request.nextUrl.searchParams.get("athlete_id");
    let query = serviceClient
      .from("swing_analyses")
      .select(
        "id, status, swing_count, strengths, improvements, recommended_drills, raw_analysis, " +
        "created_at, tokens_used, result_video_url, athlete_id, " +
        "scores, comments_and_annotations, swing_result, training_priorities"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (athleteId) {
      query = query.eq("athlete_id", athleteId);
    }

    const { data, error } = await query;

    if (error) {
      // If the new columns don't exist yet, fall back to the old query
      if (error.message?.includes("column") || error.message?.includes("schema cache")) {
        const { data: fallbackData, error: fallbackError } = await serviceClient
          .from("swing_analyses")
          .select("id, status, swing_count, strengths, improvements, recommended_drills, raw_analysis, created_at, tokens_used, result_video_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 });

        const analyses = (fallbackData || []).map((a: any) => formatAnalysis(a));
        return NextResponse.json(analyses);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const analyses = (data || []).map((a: any) => formatAnalysis(a));
    return NextResponse.json(analyses);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatAnalysis(a: any) {
  return {
    ...a,
    score: null,
    feedback: a.raw_analysis,
    audio_url: null,
    video_url: a.result_video_url || null,
    strengths: typeof a.strengths === "string" ? JSON.parse(a.strengths) : (a.strengths || []),
    improvements: typeof a.improvements === "string" ? JSON.parse(a.improvements) : (a.improvements || []),
    recommended_drills:
      typeof a.recommended_drills === "string"
        ? JSON.parse(a.recommended_drills)
        : (a.recommended_drills || []),
    scores: a.scores || null,
    comments_and_annotations: a.comments_and_annotations || null,
    swing_result: a.swing_result || null,
    training_priorities: a.training_priorities || null,
  };
}
