"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TokenBadge from "@/components/TokenBadge";
import { drills, drillCategories } from "@/data/drills";
import { createClient } from "@/lib/supabase/client";

const categoryColors: Record<string, string> = {
  Balance: "#3B82F6",
  Load: "#8B5CF6",
  Sequencing: "#F59E0B",
  "Bat Path": "#10B981",
  Timing: "#EC4899",
  Posture: "#6366F1",
};

export default function DrillsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [tokenBalance, setTokenBalance] = useState(10);

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

  const filtered = selectedCategory === "All" ? drills : drills.filter((d) => d.category === selectedCategory);

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0F1E" }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: "#0A0F1E", borderBottom: "1px solid #1f2937" }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">⚾</span>
          <span className="text-lg font-black text-white">NextSport</span>
        </div>
        <TokenBadge balance={tokenBalance} />
      </div>

      <div className="px-4 py-6 max-w-sm mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white mb-1">Drill Library 🏋️</h1>
          <p className="text-gray-400 text-sm">Free drills to fix your mechanics</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {drillCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all"
              style={{
                background: selectedCategory === cat ? "#F59E0B" : "#111827",
                color: selectedCategory === cat ? "#0A0F1E" : "#9ca3af",
                border: `1px solid ${selectedCategory === cat ? "#F59E0B" : "#374151"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Drills Grid */}
        <div className="space-y-3">
          {filtered.map((drill) => (
            <div key={drill.id} className="p-4 rounded-2xl" style={{ background: "#111827" }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${categoryColors[drill.category] || "#374151"}22`,
                        color: categoryColors[drill.category] || "#9ca3af",
                      }}
                    >
                      {drill.category}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "#052e16", color: "#10B981" }}
                    >
                      FREE
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm">{drill.name}</h3>
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">{drill.description}</p>
              <Link
                href={`/drills/${drill.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                style={{ background: "#1c1405", color: "#F59E0B", border: "1px solid #F59E0B33" }}
              >
                View Drill →
              </Link>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
