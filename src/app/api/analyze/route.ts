import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const TOKEN_COST_PER_10S = 1;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const video = formData.get("video") as File | null;
    const durationStr = formData.get("duration") as string | null;
    const duration = durationStr ? parseInt(durationStr) : 0;

    if (!video) {
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }

    const tokenCost = Math.max(1, Math.ceil(duration / 10));

    // Check token balance
    const serviceClient = await createServiceClient();
    const { data: tokenData, error: tokenError } = await serviceClient
      .from("token_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Token balance not found" }, { status: 400 });
    }

    if (tokenData.balance < tokenCost) {
      return NextResponse.json({
        error: "Insufficient tokens",
        required: tokenCost,
        available: tokenData.balance,
      }, { status: 402 });
    }

    // Deduct tokens
    await serviceClient
      .from("token_balances")
      .update({ balance: tokenData.balance - tokenCost, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // Record transaction
    await serviceClient.from("token_transactions").insert({
      user_id: user.id,
      amount: -tokenCost,
      type: "analysis",
      description: `Swing analysis (${duration}s video)`,
    });

    // Create analysis record (status: processing)
    const { data: analysis, error: analysisError } = await serviceClient
      .from("swing_analyses")
      .insert({
        user_id: user.id,
        duration_seconds: duration,
        tokens_used: tokenCost,
        status: "processing",
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json({ error: "Failed to create analysis" }, { status: 500 });
    }

    // TODO: Queue actual video processing job here
    // For now, mark as completed with mock data after a delay
    // In production, this would trigger an async worker/queue

    // Simulate analysis completion with mock data
    await serviceClient
      .from("swing_analyses")
      .update({
        status: "completed",
        swing_count: 2,
        strengths: JSON.stringify(["Strong hip rotation", "Good load position", "Consistent stride"]),
        improvements: JSON.stringify(["Casting the barrel early", "Head pulling off contact"]),
        recommended_drills: JSON.stringify(["1", "2", "4"]),
        raw_analysis: "Mock analysis — real AI processing will be wired up in production.",
      })
      .eq("id", analysis.id);

    return NextResponse.json({
      analysisId: analysis.id,
      status: "completed",
      tokensUsed: tokenCost,
      tokensRemaining: tokenData.balance - tokenCost,
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
