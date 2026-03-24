"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TokenBadge from "@/components/TokenBadge";
import { drills } from "@/data/drills";
import { createClient } from "@/lib/supabase/client";

const categoryColors: Record<string, string> = {
  Balance: "#3B82F6",
  Load: "#8B5CF6",
  Sequencing: "#F59E0B",
  "Bat Path": "#10B981",
  Timing: "#EC4899",
  Posture: "#6366F1",
};

export default function DrillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const drill = drills.find((d) => d.id === params.id);
  const [tokenBalance, setTokenBalance] = useState(10);
  const [logged, setLogged] = useState(false);
  const [logging, setLogging] = useState(false);
  const [reps, setReps] = useState(10);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("token_balances").select("balance").eq("user_id", user.id).single();
      if (data) setTokenBalance(data.balance);
    };
    load();
  }, []);

  if (!drill) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🤔</div>
          <p className="text-white font-bold mb-3">Drill not found</p>
          <Link href="/drills" className="text-sm" style={{ color: "#F59E0B" }}>Back to drills</Link>
        </div>
      </div>
    );
  }

  const handleLogPractice = async () => {
    setLogging(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("practice_logs").insert({
      user_id: user.id,
      drill_id: drill.id,
      drill_name: drill.name,
      reps,
      notes: "",
    });

    setLogged(true);
    setLogging(false);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0F1E" }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: "#0A0F1E", borderBottom: "1px solid #1f2937" }}>
        <button onClick={() => router.back()} className="text-gray-400 text-xl p-1">←</button>
        <h1 className="text-white font-bold text-sm">Drill Detail</h1>
        <TokenBadge balance={tokenBalance} />
      </div>

      <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: `${categoryColors[drill.category] || "#374151"}22`,
                color: categoryColors[drill.category] || "#9ca3af",
              }}
            >
              {drill.category}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#052e16", color: "#10B981" }}>
              FREE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">{drill.name}</h1>
        </div>

        {/* Demo Placeholder */}
        <div
          className="w-full aspect-video rounded-2xl flex items-center justify-center"
          style={{ background: "#111827" }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🎬</div>
            <p className="text-white text-sm font-bold">Demo Video</p>
            <p className="text-gray-500 text-xs mt-1">Coming soon</p>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 rounded-2xl" style={{ background: "#111827" }}>
          <p className="text-gray-300 text-sm leading-relaxed">{drill.description}</p>
        </div>

        {/* Focus Points */}
        <div className="p-4 rounded-2xl" style={{ background: "#111827" }}>
          <p className="text-xs font-black mb-3 tracking-wide" style={{ color: "#10B981" }}>
            🎯 FOCUS POINTS
          </p>
          <ul className="space-y-2">
            {drill.focusPoints.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-gray-200">
                <span style={{ color: "#10B981" }} className="mt-0.5 shrink-0">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Common Mistakes */}
        <div className="p-4 rounded-2xl" style={{ background: "#111827" }}>
          <p className="text-xs font-black mb-3 tracking-wide" style={{ color: "#ef4444" }}>
            ⚠️ COMMON MISTAKES
          </p>
          <ul className="space-y-2">
            {drill.commonMistakes.map((mistake) => (
              <li key={mistake} className="flex items-start gap-2 text-sm text-gray-200">
                <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                {mistake}
              </li>
            ))}
          </ul>
        </div>

        {/* Log Practice */}
        {!logged ? (
          <div className="p-4 rounded-2xl space-y-3" style={{ background: "#111827" }}>
            <h3 className="text-white font-bold">Log Practice</h3>
            <div className="flex items-center gap-3">
              <label className="text-gray-400 text-sm">Reps:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReps(Math.max(1, reps - 5))}
                  className="w-8 h-8 rounded-full font-bold text-white flex items-center justify-center"
                  style={{ background: "#374151" }}
                >
                  −
                </button>
                <span className="text-white font-bold w-8 text-center">{reps}</span>
                <button
                  onClick={() => setReps(reps + 5)}
                  className="w-8 h-8 rounded-full font-bold text-white flex items-center justify-center"
                  style={{ background: "#374151" }}
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={handleLogPractice}
              disabled={logging}
              className="w-full py-3 rounded-full font-black text-sm disabled:opacity-50"
              style={{ background: "#F59E0B", color: "#0A0F1E" }}
            >
              {logging ? "Logging..." : "Log Practice ✓"}
            </button>
          </div>
        ) : (
          <div
            className="p-4 rounded-2xl text-center"
            style={{ background: "#052e16", border: "1px solid #10B981" }}
          >
            <div className="text-2xl mb-1">✅</div>
            <p className="text-white font-bold text-sm">Practice logged!</p>
            <p className="text-gray-400 text-xs mt-1">{reps} reps • {drill.name}</p>
          </div>
        )}

        {/* Back to Drills */}
        <Link
          href="/drills"
          className="block w-full py-3 rounded-full text-center font-bold text-sm border"
          style={{ borderColor: "#374151", color: "white" }}
        >
          ← Back to Drill Library
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
