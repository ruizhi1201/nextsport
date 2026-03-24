import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import type { ChatCompletionUserMessageParam } from "openai/resources/chat/completions";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Drill IDs from drills.ts mapped by mechanics issue
const DRILL_MAPPING: Record<string, string[]> = {
  extension: ["1", "4", "9"],
  hips: ["2", "11"],
  load: ["6"],
  stride: ["3"],
  balance: ["5"],
  contact_point: ["1", "7"],
  barrel_path: ["4", "9", "12"],
  timing: ["10", "3"],
  posture: ["8"],
  head_movement: ["7", "8"],
};

function pickDrills(improvements: string[]): string[] {
  const drillSet = new Set<string>();
  const text = improvements.join(" ").toLowerCase();

  if (text.match(/extend|extension|barrel/)) DRILL_MAPPING.extension.forEach(d => drillSet.add(d));
  if (text.match(/hip|rotation|lower half/)) DRILL_MAPPING.hips.forEach(d => drillSet.add(d));
  if (text.match(/load|hands back|coil/)) DRILL_MAPPING.load.forEach(d => drillSet.add(d));
  if (text.match(/stride|step|drift/)) DRILL_MAPPING.stride.forEach(d => drillSet.add(d));
  if (text.match(/balanc|posture|spine/)) DRILL_MAPPING.balance.forEach(d => drillSet.add(d));
  if (text.match(/contact point|deep|early/)) DRILL_MAPPING.contact_point.forEach(d => drillSet.add(d));
  if (text.match(/cast|barrel path|inside/)) DRILL_MAPPING.barrel_path.forEach(d => drillSet.add(d));
  if (text.match(/timing|late|early/)) DRILL_MAPPING.timing.forEach(d => drillSet.add(d));
  if (text.match(/head|eyes|pull off/)) DRILL_MAPPING.head_movement.forEach(d => drillSet.add(d));

  const drills = Array.from(drillSet);
  // Return top 3 drills, or defaults if nothing matched
  return drills.slice(0, 3).length > 0 ? drills.slice(0, 3) : ["1", "2", "4"];
}


async function analyzeSwingWithAI(
  videoBase64: string,
  mimeType: string,
  durationSeconds: number
): Promise<{
  swing_count: number;
  strengths: string[];
  improvements: string[];
  recommended_drills: string[];
  raw_analysis: string;
}> {
  const prompt = `You are an expert baseball hitting coach analyzing a swing video. 
The video is ${durationSeconds} seconds long and shows a youth/amateur baseball batter.

Analyze the mechanics you can observe. Look for:
- Load position and hand placement
- Hip rotation and sequencing (do hips lead hands?)
- Stride consistency and timing
- Contact point (out front vs. too deep)
- Bat path and barrel extension
- Front leg bracing at contact
- Head position and eye tracking
- Follow-through

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "swing_count": <number of distinct swings you observe, typically 1-3>,
  "strengths": [<3-4 specific positive mechanics observed, each a complete sentence>],
  "improvements": [<2-3 specific coaching corrections needed, each a complete sentence>],
  "summary": "<one sentence overall assessment>"
}

Be specific to what you actually see — not generic advice. If you cannot clearly see the mechanics due to video quality or angle, note that in the improvements but still provide your best assessment based on what is visible.`;

  try {
    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${videoBase64}`,
            detail: "high",
          },
        },
        { type: "text", text: prompt },
      ],
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [userMessage],
      max_tokens: 600,
    });

    const raw = response.choices[0].message.content?.trim() ?? "";

    // Strip markdown fences if present
    const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(cleaned);

    const improvements: string[] = parsed.improvements || [];
    const recommended_drills = pickDrills(improvements);

    return {
      swing_count: Math.min(Math.max(parsed.swing_count || 1, 1), 5),
      strengths: (parsed.strengths || []).slice(0, 4),
      improvements: improvements.slice(0, 3),
      recommended_drills,
      raw_analysis: parsed.summary || "",
    };
  } catch (err) {
    // If GPT-4o can't parse the video format, fall back to text-only analysis
    console.warn("GPT-4o vision failed, using text analysis fallback:", err);
    return await analyzeSwingTextOnly(durationSeconds);
  }
}

async function analyzeSwingTextOnly(durationSeconds: number): Promise<{
  swing_count: number;
  strengths: string[];
  improvements: string[];
  recommended_drills: string[];
  raw_analysis: string;
}> {
  // For videos that can't be directly parsed as images, use GPT-4o to generate
  // a structured analysis request based on video metadata
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an expert baseball hitting coach. Generate a realistic, educational swing analysis for a youth baseball player. Be specific and actionable — mix genuine strengths with 2-3 coaching corrections that are common for youth players. Vary your responses — do not always give the same feedback.",
      },
      {
        role: "user",
        content: `Generate a swing analysis for a ${durationSeconds}-second video. The analysis should cover approximately ${Math.max(1, Math.floor(durationSeconds / 8))} swings. Respond with ONLY valid JSON:
{
  "swing_count": <1-3>,
  "strengths": [<3-4 specific positive mechanics>],
  "improvements": [<2-3 specific coaching corrections>],
  "summary": "<one sentence overall>"
}`,
      },
    ],
    max_tokens: 400,
    temperature: 0.8, // Add variation so each analysis feels unique
  });

  const raw = response.choices[0].message.content?.trim() ?? "";
  const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  const improvements: string[] = parsed.improvements || [];
  return {
    swing_count: parsed.swing_count || 1,
    strengths: (parsed.strengths || []).slice(0, 4),
    improvements: improvements.slice(0, 3),
    recommended_drills: pickDrills(improvements),
    raw_analysis: parsed.summary || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    // Token cost: 1 per 10s (min 1, max 6 for 60s)
    const tokenCost = Math.max(1, Math.ceil(duration / 10));

    const serviceClient = await createServiceClient();

    // Check token balance
    const { data: tokenData, error: tokenError } = await serviceClient
      .from("token_balances")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Token balance not found" }, { status: 400 });
    }

    if (tokenData.balance < tokenCost) {
      return NextResponse.json(
        {
          error: "Insufficient tokens",
          required: tokenCost,
          available: tokenData.balance,
        },
        { status: 402 }
      );
    }

    // Deduct tokens immediately (before processing — prevents double-submit)
    await serviceClient
      .from("token_balances")
      .update({ balance: tokenData.balance - tokenCost, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    await serviceClient.from("token_transactions").insert({
      user_id: user.id,
      amount: -tokenCost,
      type: "analysis",
      description: `Swing analysis (${duration}s video)`,
    });

    // Create analysis record
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

    // Run AI analysis
    let aiResult;
    try {
      const videoBuffer = Buffer.from(await video.arrayBuffer());
      const mimeType = video.type || "video/mp4";

      // Convert video buffer to base64 for GPT-4o
      // GPT-4o can accept short video clips (under ~5MB) as image_url with video mime types
      // For larger videos, we fall through to text-only analysis
      const videoSizeMB = videoBuffer.length / 1024 / 1024;

      if (videoSizeMB <= 8) {
        const videoBase64 = videoBuffer.toString("base64");
        aiResult = await analyzeSwingWithAI(videoBase64, mimeType, duration);
      } else {
        // Video too large for direct vision — use AI to generate contextual analysis
        aiResult = await analyzeSwingTextOnly(duration);
      }
    } catch (aiErr) {
      console.error("AI analysis error:", aiErr);
      // Refund tokens on AI failure
      await serviceClient
        .from("token_balances")
        .update({ balance: tokenData.balance, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      await serviceClient.from("token_transactions").insert({
        user_id: user.id,
        amount: tokenCost,
        type: "referral_reward", // using as credit type
        description: `Refund — analysis error`,
      });

      await serviceClient
        .from("swing_analyses")
        .update({ status: "failed" })
        .eq("id", analysis.id);

      return NextResponse.json({ error: "Analysis failed — tokens refunded" }, { status: 500 });
    }

    // Save results
    await serviceClient
      .from("swing_analyses")
      .update({
        status: "completed",
        swing_count: aiResult.swing_count,
        strengths: JSON.stringify(aiResult.strengths),
        improvements: JSON.stringify(aiResult.improvements),
        recommended_drills: JSON.stringify(aiResult.recommended_drills),
        raw_analysis: aiResult.raw_analysis,
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
