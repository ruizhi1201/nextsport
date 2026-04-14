import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Weekly cleanup of old annotated video files from Supabase storage
// Triggered by Vercel cron (see vercel.json)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const serviceClient = await createServiceClient();

    // Find analyses older than 30 days that have result videos
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const { data: oldAnalyses, error } = await serviceClient
      .from("swing_analyses")
      .select("id, user_id, result_video_url")
      .lt("created_at", cutoffDate.toISOString())
      .not("result_video_url", "is", null)
      .limit(50);

    if (error) {
      console.error("Cleanup query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let deleted = 0;
    let errors = 0;

    for (const analysis of (oldAnalyses || [])) {
      try {
        // Extract storage path from signed URL
        const url = new URL(analysis.result_video_url);
        const pathMatch = url.pathname.match(/\/object\/sign\/swing-videos\/(.+?)(?:\?|$)/);
        if (!pathMatch) continue;

        const storagePath = decodeURIComponent(pathMatch[1]);

        // Delete from storage
        await serviceClient.storage.from("swing-videos").remove([storagePath]);

        // Clear the URL from DB
        await serviceClient
          .from("swing_analyses")
          .update({ result_video_url: null })
          .eq("id", analysis.id);

        deleted++;
      } catch (err) {
        console.error(`Failed to delete video for analysis ${analysis.id}:`, err);
        errors++;
      }
    }

    console.log(`Cleanup complete: deleted ${deleted} files, ${errors} errors`);
    return NextResponse.json({ deleted, errors, processed: (oldAnalyses || []).length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
