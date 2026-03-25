"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import BottomNav from "@/components/BottomNav";
import TokenBadge from "@/components/TokenBadge";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  player_name: string | null;
  role: string;
  referral_code: string;
}

interface Analysis {
  id: string;
  created_at: string;
  status: string;
  swing_count: number | null;
  duration_seconds: number | null;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tokenBalance, setTokenBalance] = useState(10);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showUpgradeToast, setShowUpgradeToast] = useState(upgraded);

  useEffect(() => {
    if (upgraded) {
      // Clean URL without refreshing
      router.replace("/dashboard", { scroll: false });
      // Auto-dismiss toast after 5s
      const timer = setTimeout(() => setShowUpgradeToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [upgraded, router]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      setUserEmail(user.email || "");

      const [profileRes, tokenRes, analysesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("token_balances").select("balance").eq("user_id", user.id).single(),
        supabase.from("swing_analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (tokenRes.data) setTokenBalance(tokenRes.data.balance);
      if (analysesRes.data) setAnalyses(analysesRes.data);
      setLoading(false);
    };
    load();
  }, []);

  const displayName = profile?.player_name || userEmail.split("@")[0] || "Slugger";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">⚾</div>
          <p className="text-gray-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0F1E" }}>
      {/* Upgrade success toast */}
      {showUpgradeToast && (
        <div
          className="fixed top-4 left-1/2 z-50 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl"
          style={{
            background: "#1c1405",
            border: "2px solid #F59E0B",
            transform: "translateX(-50%)",
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-white font-black text-sm">Welcome to Premium!</p>
            <p className="text-gray-400 text-xs">200 tokens added to your account</p>
          </div>
          <button
            onClick={() => setShowUpgradeToast(false)}
            className="text-gray-500 text-lg ml-2 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: "#0A0F1E", borderBottom: "1px solid #1f2937" }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">⚾</span>
          <span className="text-lg font-black text-white">NextSport</span>
        </div>
        <TokenBadge balance={tokenBalance} />
      </div>

      <div className="px-4 py-6 max-w-sm mx-auto space-y-6">
        {/* Welcome */}
        <div>
          <p className="text-gray-400 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-black text-white">
            {displayName} 👋
          </h1>
        </div>

        {/* Token Balance Card */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "#111827" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Token Balance</p>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#1f2937", color: "#9ca3af" }}>
              Free Plan
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black" style={{ color: "#F59E0B" }}>{tokenBalance}</span>
            <span className="text-gray-400">tokens</span>
          </div>
          <div className="w-full rounded-full h-2 mb-3" style={{ background: "#374151" }}>
            <div
              className="h-2 rounded-full"
              style={{ background: "#F59E0B", width: `${Math.min(100, (tokenBalance / 10) * 100)}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs">Refills every Monday • 10 tokens/week</p>
        </div>

        {/* Analyze CTA */}
        <Link
          href="/analyze"
          className="block w-full py-4 rounded-full text-center font-black text-lg"
          style={{ background: "#F59E0B", color: "#0A0F1E" }}
        >
          Analyze a Swing ⚾
        </Link>

        {/* Recent Analyses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold">Recent Analyses</h2>
            <Link href="/analyze" className="text-xs" style={{ color: "#F59E0B" }}>View all</Link>
          </div>

          {analyses.length === 0 ? (
            <div
              className="p-6 rounded-2xl text-center"
              style={{ background: "#111827" }}
            >
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-gray-400 text-sm">No analyses yet.</p>
              <p className="text-gray-500 text-xs mt-1">Upload your first swing to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((a) => (
                <Link
                  key={a.id}
                  href={`/analyze?id=${a.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "#111827" }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#1f2937" }}
                  >
                    <span className="text-2xl">⚾</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">
                      {a.swing_count ? `${a.swing_count} swings` : "Swing Analysis"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {a.duration_seconds ? ` • ${a.duration_seconds}s` : ""}
                    </p>
                  </div>
                  <div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{
                        background: a.status === "completed" ? "#052e16" : "#1c1405",
                        color: a.status === "completed" ? "#10B981" : "#F59E0B",
                      }}
                    >
                      {a.status === "completed" ? "Done" : "Processing"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Referral Banner */}
        <div
          className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: "#0c1a2e", border: "1px solid #1d4ed8" }}
        >
          <span className="text-2xl">🎁</span>
          <div className="flex-1">
            <p className="text-white text-sm font-bold">Invite friends, earn tokens</p>
            <p className="text-gray-400 text-xs">+30 tokens when a friend analyzes their first swing</p>
          </div>
          <Link
            href="/profile"
            className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
            style={{ background: "#3B82F6", color: "white" }}
          >
            Share
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">⚾</div>
          <p className="text-gray-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
