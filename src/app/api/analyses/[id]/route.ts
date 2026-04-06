import { NextRequest, NextResponse } from "next/server";
import { createMobileClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createMobileClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await serviceClient
      .from("swing_analyses")
      .select(
        "id, status, swing_count, strengths, improvements, recommended_drills, raw_analysis, " +
        "created_at, tokens_used, result_video_url, " +
        "scores, comments_and_annotations, swing_result, training_priorities"
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      // If new columns don't exist yet, fall back to old query
      if (error?.message?.includes("column") || error?.message?.includes("schema cache")) {
        const { data: fallbackData, error: fallbackError } = await serviceClient
          .from("swing_analyses")
          .select("id, status, swing_count, strengths, improvements, recommended_drills, raw_analysis, created_at, tokens_used, result_video_url")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (fallbackError || !fallbackData) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
        return NextResponse.json(formatAnalysis(fallbackData));
      }
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json(formatAnalysis(data));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatAnalysis(data: any) {
  return {
    ...data,
    score: null,
    feedback: data.raw_analysis,
    audio_url: null,
    video_url: data.result_video_url || null,
    strengths:
      typeof data.strengths === "string" ? JSON.parse(data.strengths) : (data.strengths || []),
    improvements:
      typeof data.improvements === "string"
        ? JSON.parse(data.improvements)
        : (data.improvements || []),
    recommended_drills:
      typeof data.recommended_drills === "string"
        ? JSON.parse(data.recommended_drills)
        : (data.recommended_drills || []),
    scores: data.scores || null,
    comments_and_annotations: data.comments_and_annotations || null,
    swing_result: data.swing_result || null,
    training_priorities: data.training_priorities || null,
  };
}
