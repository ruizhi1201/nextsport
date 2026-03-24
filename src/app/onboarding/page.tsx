"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "player" | "parent" | "coach";
type AgeGroup = "7-9" | "10-12" | "13-15" | "16-18";
type Sport = "baseball" | "softball";
type Level = "Rec" | "A" | "AA" | "AAA" | "Elite";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [sport, setSport] = useState<Sport>("baseball");
  const [level, setLevel] = useState<Level | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("profiles").upsert({
      id: user.id,
      role,
      player_name: playerName || user.email?.split("@")[0],
      age_group: ageGroup,
      sport,
      level,
      onboarding_completed: true,
    });

    // Create token balance
    await supabase.from("token_balances").upsert({
      user_id: user.id,
      balance: 10,
    });

    setSaving(false);
    setStep(3);
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className="w-8 h-2 rounded-full transition-all"
          style={{
            background: s <= step ? "#F59E0B" : "#374151",
            width: s === step ? "2rem" : "0.5rem",
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-8 max-w-sm mx-auto" style={{ background: "#0A0F1E" }}>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">⚾</span>
        <span className="text-lg font-black text-white">NextSport</span>
      </div>

      <StepIndicator />

      {/* Step 1: Role */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Who are you? 👋</h1>
          <p className="text-gray-400 text-sm mb-8">Tell us how you&apos;ll use NextSport</p>

          <div className="space-y-3">
            {(["player", "parent", "coach"] as Role[]).map((r) => {
              const info = {
                player: { emoji: "⚾", label: "Player", desc: "I want to analyze my own swing" },
                parent: { emoji: "👨‍👦", label: "Parent", desc: "I'm setting this up for my child" },
                coach: { emoji: "📋", label: "Coach", desc: "I coach players and want to track progress" },
              }[r];

              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all"
                  style={{
                    background: role === r ? "#1c1405" : "#111827",
                    border: `2px solid ${role === r ? "#F59E0B" : "#374151"}`,
                  }}
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <div>
                    <p className="text-white font-bold">{info.label}</p>
                    <p className="text-gray-400 text-xs">{info.desc}</p>
                  </div>
                  {role === r && <span className="ml-auto" style={{ color: "#F59E0B" }}>✓</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => role && setStep(2)}
            disabled={!role}
            className="w-full py-4 rounded-full font-black mt-8 disabled:opacity-30"
            style={{ background: "#F59E0B", color: "#0A0F1E" }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Profile */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Player Profile 📋</h1>
          <p className="text-gray-400 text-sm mb-8">Help AI personalize your analysis</p>

          <div className="space-y-5">
            {role === "parent" && (
              <div>
                <label className="text-gray-400 text-xs font-semibold mb-2 block uppercase tracking-wide">
                  Player Name
                </label>
                <input
                  type="text"
                  placeholder="Your child's name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-white text-sm"
                  style={{ background: "#111827", border: "1px solid #374151" }}
                />
              </div>
            )}

            <div>
              <label className="text-gray-400 text-xs font-semibold mb-2 block uppercase tracking-wide">
                Age Group
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["7-9", "10-12", "13-15", "16-18"] as AgeGroup[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAgeGroup(a)}
                    className="py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: ageGroup === a ? "#F59E0B" : "#111827",
                      color: ageGroup === a ? "#0A0F1E" : "#9ca3af",
                      border: `1px solid ${ageGroup === a ? "#F59E0B" : "#374151"}`,
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold mb-2 block uppercase tracking-wide">
                Sport
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["baseball", "softball"] as Sport[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSport(s)}
                    className="py-3 rounded-xl text-sm font-bold capitalize transition-all"
                    style={{
                      background: sport === s ? "#F59E0B" : "#111827",
                      color: sport === s ? "#0A0F1E" : "#9ca3af",
                      border: `1px solid ${sport === s ? "#F59E0B" : "#374151"}`,
                    }}
                  >
                    {s === "baseball" ? "⚾ Baseball" : "🥎 Softball"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold mb-2 block uppercase tracking-wide">
                Level
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(["Rec", "A", "AA", "AAA", "Elite"] as Level[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className="py-3 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: level === l ? "#F59E0B" : "#111827",
                      color: level === l ? "#0A0F1E" : "#9ca3af",
                      border: `1px solid ${level === l ? "#F59E0B" : "#374151"}`,
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-full font-bold text-sm border"
              style={{ borderColor: "#374151", color: "white" }}
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={!ageGroup || !level || saving}
              className="flex-1 py-4 rounded-full font-black text-sm disabled:opacity-30"
              style={{ background: "#F59E0B", color: "#0A0F1E" }}
            >
              {saving ? "Saving..." : "Continue →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Ready */}
      {step === 3 && (
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-black text-white mb-2">Your AI coach is ready!</h1>
          <p className="text-gray-400 text-sm mb-8">
            You&apos;re all set to start analyzing your swing
          </p>

          <div
            className="p-6 rounded-2xl mb-8"
            style={{ background: "#111827" }}
          >
            <p className="text-gray-400 text-sm mb-2">Your starting balance</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black" style={{ color: "#F59E0B" }}>10</span>
              <span className="text-white text-lg font-bold">tokens ⚡</span>
            </div>
            <p className="text-gray-500 text-xs mt-2">Refreshes every week • Free plan</p>
          </div>

          <button
            onClick={() => router.push("/analyze")}
            className="w-full py-4 rounded-full font-black text-lg"
            style={{ background: "#F59E0B", color: "#0A0F1E" }}
          >
            Upload Your First Swing ⚾
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 mt-3 text-sm"
            style={{ color: "#9ca3af" }}
          >
            Go to dashboard
          </button>
        </div>
      )}
    </div>
  );
}
