import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: analysis, error } = await supabase
    .from("swing_analyses")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (error || !analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: analysis.id,
    status: analysis.status,
    swing_count: analysis.swing_count,
    strengths: analysis.strengths,
    improvements: analysis.improvements,
    recommended_drills: analysis.recommended_drills,
    result_video_url: analysis.result_video_url,
    created_at: analysis.created_at,
  });
}
