"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: "#0A0F1E" }}>
      <div className="max-w-sm mx-auto">
        {/* Back */}
        <button onClick={() => router.back()} className="text-gray-400 mb-6 block">← Back</button>

        <div className="text-center mb-8">
          <span className="text-3xl">⚾</span>
          <h1 className="text-2xl font-black text-white mt-2">Choose Your Plan</h1>
          <p className="text-gray-400 text-sm mt-2">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        {/* Free */}
        <div className="p-5 rounded-2xl border mb-4" style={{ background: "#111827", borderColor: "#374151" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-black text-xl">Free</h2>
            <div>
              <span className="text-2xl font-black text-white">$0</span>
              <span className="text-gray-400 text-xs"> /mo</span>
            </div>
          </div>
          <ul className="space-y-3 mb-5">
            {[
              { text: "10 tokens / week", ok: true },
              { text: "1 analysis / week", ok: true },
              { text: "Basic swing history", ok: true },
              { text: "Full drill library", ok: true },
              { text: "Unlimited analyses", ok: false },
              { text: "200 tokens / week", ok: false },
              { text: "Drill tracking", ok: false },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                <span style={{ color: f.ok ? "#10B981" : "#6b7280" }}>{f.ok ? "✓" : "✕"}</span>
                <span style={{ color: f.ok ? "#d1d5db" : "#6b7280" }}>{f.text}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="block w-full py-3 rounded-full text-center font-bold text-sm border"
            style={{ borderColor: "#374151", color: "white" }}
          >
            Start Free
          </Link>
        </div>

        {/* Premium */}
        <div className="p-5 rounded-2xl relative overflow-hidden mb-6" style={{ background: "#1c1405", border: "2px solid #F59E0B" }}>
          <div
            className="absolute top-3 right-3 text-xs font-black px-2 py-1 rounded-full"
            style={{ background: "#F59E0B", color: "#0A0F1E" }}
          >
            BEST VALUE
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-xl" style={{ color: "#F59E0B" }}>Premium</h2>
            <div>
              <span className="text-2xl font-black text-white">$14.99</span>
              <span className="text-gray-400 text-xs"> /mo</span>
            </div>
          </div>
          <ul className="space-y-3 mb-5">
            {[
              "200 tokens / week",
              "Unlimited analyses",
              "Full swing dashboard",
              "Drill tracking & history",
              "Progress reports",
              "Priority AI processing",
              "Early access to new features",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span style={{ color: "#F59E0B" }}>✓</span>
                <span className="text-gray-200">{f}</span>
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-red-400 text-xs mb-3">{error}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 rounded-full font-black text-sm disabled:opacity-50"
            style={{ background: "#F59E0B", color: "#0A0F1E" }}
          >
            {loading ? "Loading checkout..." : "Go Premium — $14.99/mo ⚡"}
          </button>

          <p className="text-gray-500 text-xs text-center mt-3">
            Cancel anytime • Billed monthly
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          {[
            {
              q: "What is a token?",
              a: "Tokens are used to analyze swing videos. 1 token = 10 seconds of video. Free users get 10 tokens/week; premium gets 200.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes, cancel anytime from your profile. You keep access until the end of your billing period.",
            },
            {
              q: "How accurate is the AI analysis?",
              a: "Our AI uses frame-by-frame analysis with pose detection trained on professional baseball mechanics.",
            },
          ].map((faq) => (
            <div key={faq.q} className="p-4 rounded-2xl" style={{ background: "#111827" }}>
              <p className="text-white font-bold text-sm mb-1">❓ {faq.q}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
