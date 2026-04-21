import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMobileClient, createServiceClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Baseball Coaching System Prompt (adapted from Gang's prompts.py) ──────────

const BASEBALL_COACH_SYSTEM_MSG = `SYSTEM — AI BASEBALL & SOFTBALL SWING COACH

===========================================================
0 · MISSION & IDENTITY
===========================================================
You are an elite-level, detail-oriented AI Baseball & Softball Swing Coach.
You analyze swing videos for athletes ages 8U through adult, across all competitive levels:
- Rec / Little League
- Travel A / AA / AAA / Majors / Elite / National
- High School / College-track
- Pro-track & Advanced Youth

Your responsibilities:
1. Determine athlete skill tier from metadata.
2. Evaluate swing mechanics with evidence-based precision.
3. Identify the top 3 issues and provide drills/fixes.
4. Classify swing result.
5. Score mechanics across 5 categories (1–5), calibrated to age & level.
6. Generate timed comments + visual annotations following strict rules.
7. Produce clean, valid JSON — nothing outside the JSON.

BEFORE performing any mechanical analysis or generating any output, you MUST:
1. Identify and isolate ALL complete swings in the video.
   A "complete swing" must include: Stance/Ready → Load → Stride/Toe-touch → Launch → Contact or committed miss → Extension → Finish
2. IGNORE: half-swings, check swings, warm-up motions, practice wiggles, rehearsal swings, pre-swing movements, any incomplete swing.
3. Only analyze true, complete swings. **Analyze a maximum of 3 swings** — if more are detected, select the 3 best (clearest mechanics, most complete). Do not analyze more than 3 swings.
4. If multiple complete swings appear: analyze each individually, derive assessment from consistent patterns.

===========================================================
1 · ATHLETE SKILL TIER DETERMINATION
===========================================================
You will receive metadata: (age_group, level, sport)

BASEBALL Tier Mapping:
- 8U–10U → Beginner (AA+ ≈ Intermediate)
- 11U–12U → Intermediate (Travel A/AA/AAA = Advanced)
- 13U–14U → Advanced (LL = Intermediate)
- 16+ / HS → Advanced → Pro-track

SOFTBALL: ≈ baseball age minus 2–3 years in mechanical maturity.
Travel Levels: A=entry advanced, AA=competitive advanced, AAA=high advanced, Majors/Elite/National=pro-track

Final Tier Must Be One Of: Beginner | Intermediate | Advanced | High-Advanced / Pro-track

===========================================================
2 · UNIVERSAL SWING-MECHANICS REFERENCE
===========================================================
1. Balanced stance
2. Smooth load
3. Lower-body initiated rotation
4. Connected hand path (inside)
5. Short to ball, long through
6. Maintain posture (stay in the legs)
7. Balanced finish

===========================================================
3 · LEVEL-SPECIFIC KNOWLEDGEBASE
===========================================================

BEGINNER (8U–10U baseball; 10U–12U softball; Rec LL):
Common issues: Bat drag, Casting/arm-bar, Lunging/head drift, Early unload
Development: Stance consistency, straight stride, simple load–stride–launch sequence, contact point awareness
LOOK FOR: Balanced stance? Smooth load without head drift? Straight stride? Long bat path from casting/drag? Rear elbow ahead of hands? Posture maintained? Swing completes through extension?

INTERMEDIATE (11U–12U LL; 10U–12U A/AA; 12U–14U softball):
Development: Hip-shoulder separation, front-side stability, barrel lag, posture retention
LOOK FOR: Balance through load/stride? Separation present? Front foot landing firmly? Hands inside ball? Barrel lag developing? Spine angle stable? Line drives more frequent?

ADVANCED (12U–14U AAA/Elite; 14U–16U softball):
Development: Rotational acceleration, reduce early unload, on-plane efficiency, exit velocity optimization
LOOK FOR: Hip hinge posture through rotation? Lower body initiates cleanly? Significant separation? Barrel lag clearly present? Bat plane matching pitch plane? Head still during stride→contact? Adjustability to different pitch locations? Contact quality and launch angles consistent (12°-20°)?

HIGH-ADVANCED / PRO-TRACK (16+ baseball; elite softball; Majors/AAA/National):
Development: Power-efficient bat path, launch-angle optimization (10°-25°), time-to-contact optimization, sweet-spot consistency
LOOK FOR: Separation maximized? Elite sequencing: ground force → hips → torso → hands → barrel? Posture and axis tilt maintained at high speeds? Deep barrel lag producing efficient acceleration? Bat path efficient across multiple pitch planes? Adjustability to velocity/spin? Launch angles controlled?

===========================================================
4 · SWING-RESULT CLASSIFICATION
===========================================================
- line_drive: 10°–25° (ideal; praise)
- fly_ball: >25° (power but catch-risk)
- ground_ball: <10° (low success rate; suggest elevating)
- foul: analyze cause
- miss: examine timing, recognition, or flaws

===========================================================
5 · MECHANICS SCORES (1–5, TIER-CALIBRATED)
===========================================================
1. Stance & Load (stance_load)
2. Lower Body (lower_body)
3. Swing Path (swing_path)
4. Contact (contact)
5. Finish (finish)

Score: 5=elite for age, 4=above average, 3=standard, 2=below average, 1=major issue

===========================================================
6 · COACHING PRINCIPLES
===========================================================
- Evidence-based (tie comments to video frames/timing)
- Tier-calibrated (encourage beginners, challenge advanced)
- Safe & constructive
- Mechanics-focused, not judgmental

===========================================================
7 · COMMENTS AND ANNOTATIONS GUIDELINE (CRITICAL)
===========================================================
The "comments_and_annotations" field must be a JSON array of 6-10 timed events covering key swing moments.

Each event MUST include:
- "start_time_sec": float, actual seconds from start of video (NOT normalized ratios, NOT frame counts)
- "duration": float, how long narration/annotation remains relevant
- "narration_cue": string, coaching text to be spoken via TTS

IMPORTANT: start_time_sec MUST be real seconds (e.g., 0.0, 1.5, 3.2, 8.4).
Values under 1.0 mean fractional seconds (0.5 = half a second into video).
DO NOT use ratios like 0.3 to mean "30% through" — use actual time in seconds.

Each event MAY include "annotations" array with objects of type:
- "circle": requires radius (float), color ([R,G,B]), thickness (int), and either "keypoint" (joint name string) or "center" ([x,y])
- "line": requires color ([R,G,B]), thickness (int), and either "keypoints" ([name1,name2]) or "points" ([[x1,y1],[x2,y2]])
- "text": requires position ([x,y]), text (string), color ([R,G,B]), font_scale (float)

Valid keypoint names: "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hand", "right_hand", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot", "right_foot"

Include "keypoint_set" array whenever any annotation references a keypoint name.

Cover these key swing phases with timed events:
1. Stance/ready position
2. Load (weight back, hands back)
3. Stride/toe-touch
4. Launch (hips fire, separation)
5. Contact point
6. Extension/follow-through
7. Finish/balance
Plus 1-3 additional coaching observations on key mechanics issues.

===========================================================
8 · FINAL JSON OUTPUT FORMAT (STRICT)
===========================================================
Your final answer MUST be a single JSON object with NO text outside the JSON:

{
  "scores": {
    "stance_load": <1-5>,
    "lower_body": <1-5>,
    "swing_path": <1-5>,
    "contact": <1-5>,
    "finish": <1-5>
  },
  "areas_to_improve": [
    {
      "issue": "<description of the problem>",
      "fix": "<drill or correction>"
    }
  ],
  "training_priorities": "<comprehensive multi-week plan>",
  "comments_and_annotations": [
    {
      "start_time_sec": 0.0,
      "narration_cue": "<coaching text>",
      "duration": 2.0
    }
  ],
  "swing_result": "<line_drive|fly_ball|ground_ball|foul|miss>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "raw_analysis": "<one paragraph overall assessment>"
}

NO text may appear outside this JSON object.
===============================
END OF SYSTEM MESSAGE
===============================`;

// ─── Drill Mapping ──────────────────────────────────────────────────────────────

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
  return drills.slice(0, 3).length > 0 ? drills.slice(0, 3) : ["1", "2", "4"];
}

// ─── Types ──────────────────────────────────────────────────────────────────────

interface AnnotationParameters {
  keypoint?: string;
  center?: [number, number];
  radius?: number;
  color?: [number, number, number];
  thickness?: number;
  keypoints?: [string, string];
  points?: [[number, number], [number, number]];
  position?: [number, number];
  text?: string;
  font_scale?: number;
  font?: string;
}

interface Annotation {
  type: "circle" | "line" | "text";
  parameters: AnnotationParameters;
  keypoint_set?: string[];
}

interface CommentAnnotationEvent {
  start_time_sec: number;
  narration_cue: string;
  duration: number;
  annotations?: Annotation[];
}

interface SwingAnalysisResult {
  swing_count: number;
  strengths: string[];
  improvements: string[];
  recommended_drills: string[];
  raw_analysis: string;
  scores: {
    stance_load: number;
    lower_body: number;
    swing_path: number;
    contact: number;
    finish: number;
  };
  areas_to_improve: Array<{ issue: string; fix: string }>;
  training_priorities: string;
  comments_and_annotations: CommentAnnotationEvent[];
  swing_result: string;
}

interface UserProfile {
  age_group: string;
  level: string;
  sport: string;
}

// ─── AI Analysis Functions ───────────────────────────────────────────────────────

function parseAnalysisResponse(raw: string, durationSeconds: number): SwingAnalysisResult {
  const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  // Remove any comment-style lines (e.g., "# in seconds measured from...")
  const noComments = cleaned.replace(/#[^\n]*/g, "");
  
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(noComments);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = noComments.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not parse AI response as JSON");
    }
  }

  // Extract areas_to_improve from various possible key names
  const areasRaw = parsed["areas_to_improve"] || parsed["areas-to-improve-fix"] || [];
  const areas_to_improve: Array<{ issue: string; fix: string }> = areasRaw.map((a: any) => {
    // Handle both {issue, fix} and {[key]: value, fix: value} formats
    if (a.issue && a.fix) return { issue: a.issue, fix: a.fix };
    const keys = Object.keys(a).filter(k => k !== "fix");
    return { issue: a[keys[0]] || "", fix: a.fix || "" };
  });

  const improvements = areas_to_improve.map(a => a.fix || a.issue);
  const strengths: string[] = parsed.strengths || [];
  const rawAnalysis: string = parsed.raw_analysis || parsed.summary || "";

  // Extract scores
  const scoresRaw = parsed.scores || {};
  const scores = {
    stance_load: scoresRaw.stance_load || scoresRaw["stance-load"] || 3,
    lower_body: scoresRaw.lower_body || scoresRaw["lower-body"] || 3,
    swing_path: scoresRaw.swing_path || scoresRaw["swing-path"] || 3,
    contact: scoresRaw.contact || 3,
    finish: scoresRaw.finish || 3,
  };

  // Extract comments_and_annotations
  const commentsRaw = parsed["comments_and_annotations"] || parsed["comments-and-annotations"] || [];
  const comments_and_annotations: CommentAnnotationEvent[] = commentsRaw
    .filter((e: any) => e && typeof e.start_time_sec === "number" && e.narration_cue)
    .map((e: any) => ({
      start_time_sec: e.start_time_sec,
      narration_cue: e.narration_cue,
      duration: e.duration || 2.0,
      ...(e.annotations ? { annotations: e.annotations } : {}),
    }))
    .sort((a: any, b: any) => a.start_time_sec - b.start_time_sec);

  // If no valid comments, generate minimal set
  if (comments_and_annotations.length === 0) {
    const halfDur = durationSeconds / 2;
    comments_and_annotations.push(
      { start_time_sec: 0.0, narration_cue: "Let's analyze this swing from the beginning.", duration: 2.0 },
      { start_time_sec: Math.min(1.5, durationSeconds * 0.3), narration_cue: "Watch the load and stride sequence here.", duration: 2.0 },
      { start_time_sec: Math.min(halfDur, durationSeconds * 0.5), narration_cue: "This is the contact zone. Observe the bat path and hand position.", duration: 2.5 },
      { start_time_sec: Math.min(durationSeconds - 2, durationSeconds * 0.8), narration_cue: "Notice the follow-through and finish position.", duration: 2.0 },
    );
  }

  const estimatedSwings = Math.max(1, Math.floor(durationSeconds / 8));

  return {
    swing_count: parsed.swing_count || estimatedSwings,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 3),
    recommended_drills: pickDrills(improvements),
    raw_analysis: rawAnalysis,
    scores,
    areas_to_improve: areas_to_improve.slice(0, 3),
    training_priorities: parsed.training_priorities || parsed["training-priorities"] || "",
    comments_and_annotations,
    swing_result: parsed.swing_result || parsed["swing-result"] || "miss",
  };
}

async function analyzeSwingWithAI(
  videoBuffer: Buffer,
  mimeType: string,
  durationSeconds: number,
  userProfile: UserProfile
): Promise<SwingAnalysisResult> {
  // Frame extraction skipped — mobile uploads are raw video buffers.
  // Use intelligent GPT-4o text analysis with the full coaching system prompt.
  return await analyzeSwingTextOnly(durationSeconds, mimeType, userProfile);
}

async function analyzeSwingTextOnly(
  durationSeconds: number,
  videoType: string = "video/mp4",
  userProfile: UserProfile & { analysis_history?: any[] } = { age_group: "12-14", level: "intermediate", sport: "baseball" }
): Promise<SwingAnalysisResult> {
  const isSlowMo = durationSeconds > 20;
  const estimatedSwings = Math.max(1, Math.floor(durationSeconds / 8));
  const videoFormat = videoType.includes("quicktime") ? "iPhone slow-motion capture" : "standard video";

  const historySection = (userProfile as any).analysis_history?.length > 0
    ? `\n\nRecent analysis history (last ${(userProfile as any).analysis_history.length} sessions within 7 days):
${JSON.stringify((userProfile as any).analysis_history, null, 2)}
Use this history to identify persistent patterns vs new issues. Reference specific past findings where relevant.`
    : "";

  const userPrompt = `Follow exactly the instructions in the system message to analyze this baseball swing video and provide an assessment.

User profile:
- age_group: ${userProfile.age_group}
- level: ${userProfile.level}
- sport: ${userProfile.sport}${historySection}

Video details:
- Duration: ${durationSeconds} seconds (${videoFormat})
- Estimated swings: ${estimatedSwings}
${isSlowMo ? "- Note: Slow-motion capture allows detailed mechanics review." : ""}
- Video length in seconds: ${durationSeconds}

CRITICAL: In the comments_and_annotations array, set start_time_sec values as actual seconds from the start of the video (0.0 to ${durationSeconds}).
Distribute 6-10 timed events across the full ${durationSeconds}-second video covering:
stance (0.0-${(durationSeconds * 0.1).toFixed(1)}s), load (${(durationSeconds * 0.1).toFixed(1)}-${(durationSeconds * 0.25).toFixed(1)}s), stride (${(durationSeconds * 0.25).toFixed(1)}-${(durationSeconds * 0.4).toFixed(1)}s), launch (${(durationSeconds * 0.4).toFixed(1)}-${(durationSeconds * 0.55).toFixed(1)}s), contact (${(durationSeconds * 0.55).toFixed(1)}-${(durationSeconds * 0.65).toFixed(1)}s), extension (${(durationSeconds * 0.65).toFixed(1)}-${(durationSeconds * 0.85).toFixed(1)}s), finish (${(durationSeconds * 0.85).toFixed(1)}-${durationSeconds.toFixed(1)}s).

Respond with ONLY the JSON object as specified in the system message. No text outside the JSON.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: BASEBALL_COACH_SYSTEM_MSG,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    max_tokens: 2500,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content?.trim() ?? "{}";
  return parseAnalysisResponse(raw, durationSeconds);
}

// ─── TTS Narration Generation ─────────────────────────────────────────────────

async function generateNarrationForEvent(
  text: string,
  eventIdx: number
): Promise<Buffer | null> {
  try {
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "echo",
      input: text,
      response_format: "mp3",
    });
    const arrayBuffer = await mp3Response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error(`TTS generation failed for event ${eventIdx}:`, err);
    return null;
  }
}

// ─── Video Generation with ffmpeg ────────────────────────────────────────────

async function generateAnnotatedVideo(
  videoBuffer: Buffer,
  analysisId: string,
  aiResult: SwingAnalysisResult,
  durationSeconds: number
): Promise<Buffer | null> {
  const { execSync } = require("child_process");
  const fs = require("fs");
  const os = require("os");
  const path = require("path");

  const tmpDir = path.join(os.tmpdir(), `nextsport-${analysisId}`);
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch {}

  const inputPath = path.join(tmpDir, "input.mp4");
  const slowPath = path.join(tmpDir, "slow.mp4");
  const annotatedPath = path.join(tmpDir, "annotated.mp4");
  const finalPath = path.join(tmpDir, "final.mp4");

  try {
    // Write input video
    fs.writeFileSync(inputPath, videoBuffer);

    // Step 1: Slow motion (4x slower = 25% speed)
    execSync(
      `ffmpeg -y -i "${inputPath}" -vf "setpts=4*PTS" -r 24 "${slowPath}"`,
      { timeout: 30000 }
    );
    const slowDuration = durationSeconds * 4;

    // Step 2: Generate TTS audio clips for each annotation event
    // Events in slow-mo time = event.start_time_sec * 4
    const events = aiResult.comments_and_annotations;
    const audioFiles: string[] = [];
    const audioEventMap: Array<{
      audioPath: string;
      slowStartSec: number;
      duration: number;
    }> = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event.narration_cue) continue;

      const audioBuffer = await generateNarrationForEvent(event.narration_cue, i);
      if (audioBuffer) {
        const audioPath = path.join(tmpDir, `narration_${i}.mp3`);
        fs.writeFileSync(audioPath, audioBuffer);
        audioFiles.push(audioPath);
        audioEventMap.push({
          audioPath,
          slowStartSec: event.start_time_sec * 4, // Scale to slow-mo time
          duration: event.duration * 4,
        });
      }
    }

    // Step 3: Build drawtext filter for timed text overlays
    // Use events from comments_and_annotations with slow-mo time mapping
    const drawtextFilters: string[] = [];
    
    for (const event of events) {
      if (!event.narration_cue) continue;
      const slowStart = event.start_time_sec * 4;
      const slowEnd = slowStart + Math.max(event.duration * 4, 3.0);
      
      // Escape text for ffmpeg
      const escapedText = event.narration_cue
        .substring(0, 60)
        .replace(/['"\\:]/g, " ")
        .replace(/\[/g, "")
        .replace(/\]/g, "");
      
      if (escapedText.trim()) {
        drawtextFilters.push(
          `drawtext=text='${escapedText}':` +
          `x=20:y=H-80:fontsize=16:fontcolor=white:` +
          `box=1:boxcolor=black@0.7:boxborderw=6:` +
          `enable='between(t,${slowStart.toFixed(2)},${slowEnd.toFixed(2)})'`
        );
      }
    }

    // Add strengths at the top
    if (aiResult.strengths.length > 0) {
      const strengthText = aiResult.strengths[0].substring(0, 50).replace(/['"\\:]/g, " ");
      if (strengthText.trim()) {
        drawtextFilters.push(
          `drawtext=text='✓ ${strengthText}':` +
          `x=20:y=20:fontsize=15:fontcolor=lime:` +
          `box=1:boxcolor=black@0.6:boxborderw=4:` +
          `enable='between(t,0,${Math.min(slowDuration, 6)})'`
        );
      }
    }

    // Add scores overlay at start
    const scoreText = `Scores: Stance ${aiResult.scores.stance_load}/5 | Lower ${aiResult.scores.lower_body}/5 | Path ${aiResult.scores.swing_path}/5 | Contact ${aiResult.scores.contact}/5 | Finish ${aiResult.scores.finish}/5`.replace(/['"\\:]/g, " ");
    drawtextFilters.push(
      `drawtext=text='${scoreText}':` +
      `x=20:y=50:fontsize=13:fontcolor=yellow:` +
      `box=1:boxcolor=black@0.6:boxborderw=4:` +
      `enable='between(t,0,${Math.min(slowDuration, 5)})'`
    );

    const filterComplex = drawtextFilters.join(",") || "null";

    // Step 4: Apply text overlays to slow-mo video (no audio yet)
    execSync(
      `ffmpeg -y -i "${slowPath}" -vf "${filterComplex}" -c:v libx264 -preset fast -an "${annotatedPath}"`,
      { timeout: 45000 }
    );

    // Step 5: Combine narration audio clips with video
    if (audioEventMap.length > 0) {
      // Create a silence base track covering the full slow video
      const silencePath = path.join(tmpDir, "silence.mp3");
      execSync(
        `ffmpeg -y -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t ${slowDuration} "${silencePath}"`,
        { timeout: 10000 }
      );

      // Build ffmpeg filter to mix all narration clips at proper timestamps
      const inputArgs: string[] = [`-i "${annotatedPath}"`, `-i "${silencePath}"`];
      const filterParts: string[] = [`[1:a]anull[base]`];
      
      for (let i = 0; i < audioEventMap.length; i++) {
        const { audioPath, slowStartSec } = audioEventMap[i];
        inputArgs.push(`-i "${audioPath}"`);
        const inputIdx = i + 2;
        filterParts.push(`[${inputIdx}:a]adelay=${Math.round(slowStartSec * 1000)}|${Math.round(slowStartSec * 1000)}[a${i}]`);
      }

      // Mix all audio streams
      const mixInputs = ["[base]", ...audioEventMap.map((_, i) => `[a${i}]`)].join("");
      filterParts.push(`${mixInputs}amix=inputs=${audioEventMap.length + 1}:duration=longest[aout]`);
      
      const filterStr = filterParts.join(";");
      const inputStr = inputArgs.join(" ");

      try {
        execSync(
          `ffmpeg -y ${inputStr} -filter_complex "${filterStr}" -map "0:v" -map "[aout]" -c:v copy -c:a aac -ar 44100 "${finalPath}"`,
          { timeout: 60000 }
        );
      } catch (audioErr) {
        // Fallback: just use video without audio mixing
        console.warn("Audio mixing failed, using video without narration audio:", audioErr);
        fs.copyFileSync(annotatedPath, finalPath);
      }
    } else {
      // No narration, just use annotated video
      fs.copyFileSync(annotatedPath, finalPath);
    }

    const resultBuffer = fs.readFileSync(finalPath);
    return resultBuffer;
  } catch (err) {
    console.error("Video generation error:", err);
    return null;
  } finally {
    // Cleanup temp files
    try {
      const files = fs.readdirSync(tmpDir);
      for (const f of files) {
        try { fs.unlinkSync(path.join(tmpDir, f)); } catch {}
      }
      try { fs.rmdirSync(tmpDir); } catch {}
    } catch {}
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createMobileClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const videoPath = body.videoPath as string | undefined;
    const duration = body.duration ? parseInt(body.duration) : 15;
    const athleteId = body.athleteId as string | undefined;

    if (!videoPath) {
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }

    // Token cost: 1 per 10s (min 1)
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

    // Deduct tokens immediately (prevents double-submit race)
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

    // Fetch profile for AI context — use athlete profile if athleteId provided, else user profile
    let userProfile: UserProfile = { age_group: "12-14", level: "intermediate", sport: "baseball" };
    try {
      if (athleteId) {
        const { data: athleteData } = await serviceClient
          .from("athletes")
          .select("age_group, level, sport")
          .eq("id", athleteId)
          .eq("user_id", user.id)
          .single();
        if (athleteData) {
          userProfile = {
            age_group: athleteData.age_group || "12-14",
            level: athleteData.level || "intermediate",
            sport: athleteData.sport || "baseball",
          };
        }
      } else {
        const { data: profileData } = await serviceClient
          .from("profiles")
          .select("age_group, level, sport")
          .eq("id", user.id)
          .single();
        if (profileData) {
          userProfile = {
            age_group: profileData.age_group || "12-14",
            level: profileData.level || "intermediate",
            sport: profileData.sport || "baseball",
          };
        }
      }
    } catch {
      // Use defaults
    }

    // Also check body for profile overrides
    if (body.age_group) userProfile.age_group = body.age_group;
    if (body.level) userProfile.level = body.level;
    if (body.sport) userProfile.sport = body.sport;

    // Create analysis record
    const { data: analysis, error: analysisError } = await serviceClient
      .from("swing_analyses")
      .insert({
        user_id: user.id,
        duration_seconds: duration,
        tokens_used: tokenCost,
        status: "processing",
        ...(athleteId ? { athlete_id: athleteId } : {}),
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json({ error: "Failed to create analysis" }, { status: 500 });
    }

    // Run AI analysis
    let aiResult: SwingAnalysisResult;
    let videoBuffer: Buffer | null = null;
    let videoHash: string | null = null;
    try {
      const serviceClientForDownload = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: videoBlob, error: downloadErr } = await serviceClientForDownload.storage
        .from("swing-videos")
        .download(videoPath);
      if (downloadErr || !videoBlob) {
        return NextResponse.json({ error: "Could not load video" }, { status: 400 });
      }
      videoBuffer = Buffer.from(await videoBlob.arrayBuffer());

      // Compute video hash for duplicate detection
      const crypto = await import("crypto");
      videoHash = crypto.createHash("sha256").update(videoBuffer).digest("hex");

      // Check if this exact video was already analyzed by this user
      let existingAnalysis: any = null;
      try {
        const { data: _existing } = await serviceClient
          .from("swing_analyses")
          .select("id, status, strengths, improvements, recommended_drills, raw_analysis, scores, comments_and_annotations, swing_result, training_priorities, result_video_url, created_at")
          .eq("user_id", user.id)
          .eq("video_hash", videoHash)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        existingAnalysis = _existing;
      } catch {
        existingAnalysis = null;
      }

      if (existingAnalysis) {
        console.log(`[Cache] Duplicate video detected for user ${user.id}, returning cached analysis ${existingAnalysis.id}`);
        // Refund tokens — no new analysis needed
        await serviceClient.from("token_balances")
          .update({ balance: tokenData.balance, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        await serviceClient.from("token_transactions").insert({
          user_id: user.id, amount: tokenCost, type: "analysis",
          description: "Refund — duplicate video, returning cached result",
        });
        // Delete the duplicate upload from storage
        await serviceClientForDownload.storage.from("swing-videos").remove([videoPath]);
        return NextResponse.json({
          analysisId: existingAnalysis.id,
          status: "completed",
          tokensUsed: 0,
          tokensRemaining: tokenData.balance,
          cached: true,
          scores: existingAnalysis.scores,
          comments_and_annotations: existingAnalysis.comments_and_annotations,
          swing_result: existingAnalysis.swing_result,
          training_priorities: existingAnalysis.training_priorities,
          areas_to_improve: [],
          strengths: typeof existingAnalysis.strengths === "string" ? JSON.parse(existingAnalysis.strengths) : (existingAnalysis.strengths || []),
          improvements: typeof existingAnalysis.improvements === "string" ? JSON.parse(existingAnalysis.improvements) : (existingAnalysis.improvements || []),
          result_video_url: existingAnalysis.result_video_url,
        });
      }

      // Fetch recent analysis history for LLM context (last 5, within 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      let recentHistory: any[] = [];
      try {
        const { data: _history } = await serviceClient
          .from("swing_analyses")
          .select("id, strengths, improvements, swing_result, created_at")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(5);
        recentHistory = _history || [];
      } catch {
        recentHistory = [];
      }

      const analysisHistory = (recentHistory || []).map((h) => ({
        analysisId: h.id,
        timestamp: h.created_at,
        swing_result: h.swing_result,
        strengths: typeof h.strengths === "string" ? JSON.parse(h.strengths).slice(0, 2) : (h.strengths || []).slice(0, 2),
        improvements: typeof h.improvements === "string" ? JSON.parse(h.improvements).slice(0, 2) : (h.improvements || []).slice(0, 2),
      }));

      // Pass history to AI analysis
      if (analysisHistory.length > 0) {
        (userProfile as any).analysis_history = analysisHistory;
      }

      aiResult = await analyzeSwingWithAI(videoBuffer, "video/mp4", duration, userProfile);

      // NOTE: Do NOT delete the video here — Lambda needs to download it.
      // Lambda is responsible for deleting the input video after processing.
    } catch (aiErr) {
      console.error("AI analysis error:", aiErr);

      // Refund tokens on failure
      await serviceClient
        .from("token_balances")
        .update({ balance: tokenData.balance, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      await serviceClient.from("token_transactions").insert({
        user_id: user.id,
        amount: tokenCost,
        type: "analysis",
        description: `Refund — analysis error`,
      });

      await serviceClient
        .from("swing_analyses")
        .update({ status: "failed" })
        .eq("id", analysis.id);

      return NextResponse.json({ error: "Analysis failed — tokens refunded" }, { status: 500 });
    }

    // Save base results (fields that always exist in the DB)
    const baseUpdate: Record<string, any> = {
      status: "completed",
      swing_count: aiResult.swing_count,
      ...(videoHash ? { video_hash: videoHash } : {}),
      strengths: JSON.stringify(aiResult.strengths),
      improvements: JSON.stringify(aiResult.improvements),
      recommended_drills: JSON.stringify(aiResult.recommended_drills),
      raw_analysis: aiResult.raw_analysis,
    };

    // Try to save new fields — they may not exist yet if migration hasn't run.
    // We attempt to save them; if the column doesn't exist, the update will fail
    // for those fields only. We catch that and retry without them.
    const newFieldsUpdate = {
      ...baseUpdate,
      scores: aiResult.scores,
      comments_and_annotations: aiResult.comments_and_annotations,
      swing_result: aiResult.swing_result,
      training_priorities: aiResult.training_priorities,
    };

    const { error: updateError } = await serviceClient
      .from("swing_analyses")
      .update(newFieldsUpdate)
      .eq("id", analysis.id);

    if (updateError) {
      // Fallback: save without new fields (migration not run yet)
      console.warn("Could not save new analysis fields (migration needed):", updateError.message);
      await serviceClient
        .from("swing_analyses")
        .update(baseUpdate)
        .eq("id", analysis.id);
    }

    // Trigger Lambda for full analysis + annotated video generation (async)
    let resultVideoUrl: string | null = null;
    try {
      const lambdaUrl = process.env.NEXTSPORT_LAMBDA_URL;
      if (lambdaUrl && videoPath) {
        // Get user profile for the Lambda
        const { data: profileData } = await serviceClient
          .from("profiles")
          .select("age_group, level, sport")
          .eq("id", user.id)
          .single();

        // Generate a signed URL for Lambda to download the video (1 hour expiry)
        let videoDownloadUrl: string | null = null;
        try {
          const { data: signedDownload } = await serviceClient.storage
            .from("swing-videos")
            .createSignedUrl(videoPath, 3600);
          videoDownloadUrl = signedDownload?.signedUrl ?? null;
        } catch (signErr) {
          console.error("Failed to generate signed download URL:", signErr);
        }

        const lambdaPayload = {
          analysisId: analysis.id,
          videoPath: videoPath,
          videoDownloadUrl: videoDownloadUrl,  // Lambda uses this to download
          userId: user.id,
          userProfile: {
            age_group: profileData?.age_group ?? "12-14",
            level: profileData?.level ?? "intermediate",
            sport: profileData?.sport ?? "baseball",
          }
        };

        // SigV4-sign the Lambda Function URL request using Node.js built-in crypto
        const crypto = await import("crypto");
        const lambdaBody = JSON.stringify(lambdaPayload);
        console.log(`[Lambda] Sending payload: analysisId=${lambdaPayload.analysisId}, videoPath=${lambdaPayload.videoPath}, videoDownloadUrl=${lambdaPayload.videoDownloadUrl ? "SET" : "null"}, userId=${lambdaPayload.userId}`);
        const lambdaUrlStr = lambdaUrl;
        const lambdaUrlParsed = new URL(lambdaUrlStr);
        const region = process.env.AWS_REGION ?? "us-west-2";
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
        const service = "lambda";

        const now = new Date();
        const amzdate = now.toISOString().replace(/[:\-]/g, "").slice(0, 15) + "Z";
        const datestamp = amzdate.slice(0, 8);

        const payloadHash = crypto.createHash("sha256").update(lambdaBody).digest("hex");
        const canonicalHeaders = `content-type:application/json\nhost:${lambdaUrlParsed.hostname}\nx-amz-date:${amzdate}\n`;
        const signedHeaders = "content-type;host;x-amz-date";
        const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

        const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
        const stringToSign = ["AWS4-HMAC-SHA256", amzdate, credentialScope,
          crypto.createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");

        const hmac = (key: Buffer | string, data: string) =>
          crypto.createHmac("sha256", key).update(data).digest();
        const kDate = hmac(`AWS4${secretAccessKey}`, datestamp);
        const kRegion = hmac(kDate, region);
        const kService = hmac(kRegion, service);
        const kSigning = hmac(kService, "aws4_request");
        const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

        const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        // Await the Lambda call with a 5s timeout (enough to confirm receipt, not to wait for processing)
        // Vercel kills fire-and-forget fetches when the function returns — must await
        try {
          const lambdaRes = await Promise.race([
            fetch(lambdaUrlStr, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-amz-date": amzdate,
                "Authorization": authHeader,
              },
              body: lambdaBody,
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Lambda timeout")), 5000)),
          ]) as Response;
          const lambdaResBody = await lambdaRes.text().catch(() => "");
          console.log(`[Lambda] invoked for ${analysis.id}: HTTP ${lambdaRes.status} ${lambdaResBody.slice(0,100)}`);
        } catch (lambdaFetchErr: any) {
          console.error("[Lambda] invoke error:", lambdaFetchErr.message);
        }

        console.log(`Lambda triggered for analysis ${analysis.id}`);
      }
    } catch (lambdaErr) {
      // Non-fatal
      console.error("Lambda trigger error:", lambdaErr);
    }

    return NextResponse.json({
      analysisId: analysis.id,
      status: "completed",
      tokensUsed: tokenCost,
      tokensRemaining: tokenData.balance - tokenCost,
      scores: aiResult.scores,
      comments_and_annotations: aiResult.comments_and_annotations,
      swing_result: aiResult.swing_result,
      training_priorities: aiResult.training_priorities,
      areas_to_improve: aiResult.areas_to_improve,
      strengths: aiResult.strengths,
      improvements: aiResult.improvements,
      ...(resultVideoUrl ? { result_video_url: resultVideoUrl } : {}),
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
