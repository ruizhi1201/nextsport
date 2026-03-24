import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0F1E" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 max-w-sm mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚾</span>
          <span className="text-xl font-black text-white">NextSport</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold px-4 py-2 rounded-full"
          style={{ color: "#F59E0B", border: "1px solid #F59E0B" }}
        >
          Log In
        </Link>
      </header>

      {/* Hero */}
      <section className="px-4 pt-10 pb-16 max-w-sm mx-auto text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: "#1f2937", color: "#F59E0B" }}
        >
          <span>🤖</span>
          <span>AI-Powered Baseball Coach</span>
        </div>
        <h1 className="text-4xl font-black text-white leading-tight mb-4">
          AI Swing Coach
          <br />
          <span style={{ color: "#F59E0B" }}>in Your Pocket</span>
        </h1>
        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
          Upload your swing. Get pro-level analysis in minutes.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="w-full py-4 rounded-full text-center font-black text-lg"
            style={{ background: "#F59E0B", color: "#0A0F1E" }}
          >
            Analyze My Swing Free ⚾
          </Link>
          <a
            href="#demo"
            className="w-full py-4 rounded-full text-center font-semibold text-white border border-gray-600"
          >
            See Example Analysis
          </a>
        </div>
        <p className="text-gray-500 text-xs mt-4">No credit card required • 10 free tokens/week</p>
      </section>

      {/* Features */}
      <section className="px-4 py-12 max-w-sm mx-auto">
        <h2 className="text-2xl font-black text-white text-center mb-8">
          Everything you need to{" "}
          <span style={{ color: "#F59E0B" }}>level up</span>
        </h2>
        <div className="flex flex-col gap-4">
          {[
            {
              emoji: "🎯",
              title: "AI Swing Analysis",
              desc: "Frame-by-frame breakdown of your mechanics. Know exactly what to fix.",
            },
            {
              emoji: "🏋️",
              title: "Drill Library",
              desc: "Structured training drills to fix what AI finds in your swing.",
            },
            {
              emoji: "📈",
              title: "Track Progress",
              desc: "See improvement over time with your personal swing history.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-2xl"
              style={{ background: "#111827" }}
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="text-white font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 max-w-sm mx-auto">
        <h2 className="text-2xl font-black text-white text-center mb-8">How it works</h2>
        <div className="flex flex-col gap-6">
          {[
            {
              step: "1",
              title: "Upload your swing",
              desc: "Record or upload a video up to 60 seconds. MP4 or MOV.",
            },
            {
              step: "2",
              title: "AI analyzes every frame",
              desc: "Launch position, contact point, follow-through — all analyzed.",
            },
            {
              step: "3",
              title: "Get your game plan",
              desc: "Annotated video + personalized drills to fix your weaknesses.",
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 items-start">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                style={{ background: "#F59E0B", color: "#0A0F1E" }}
              >
                {s.step}
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="px-4 py-12 max-w-sm mx-auto">
        <h2 className="text-2xl font-black text-white text-center mb-2">Sample Analysis</h2>
        <p className="text-gray-400 text-center text-sm mb-6">This is what your analysis looks like</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#111827" }}>
          {/* Mock video player */}
          <div
            className="w-full aspect-video flex items-center justify-center relative"
            style={{ background: "#1f2937" }}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">▶️</div>
              <p className="text-gray-400 text-sm">Annotated Swing Analysis</p>
            </div>
            <div
              className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: "#10B981", color: "white" }}
            >
              DEMO
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-bold">2 swings analyzed</span>
              <span className="text-gray-500 text-xs">• 0:14 video</span>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold mb-2" style={{ color: "#10B981" }}>
                ✅ STRENGTHS
              </p>
              <ul className="space-y-1">
                {["Strong hip rotation", "Good load position", "Consistent stride"].map((s) => (
                  <li key={s} className="text-sm text-gray-300 flex items-center gap-2">
                    <span style={{ color: "#10B981" }}>✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#F59E0B" }}>
                🔧 AREAS TO IMPROVE
              </p>
              <ul className="space-y-1">
                {["Casting the barrel early", "Head pulling off contact"].map((s) => (
                  <li key={s} className="text-sm text-gray-300 flex items-center gap-2">
                    <span style={{ color: "#F59E0B" }}>→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-12 max-w-sm mx-auto">
        <h2 className="text-2xl font-black text-white text-center mb-2">Simple Pricing</h2>
        <p className="text-gray-400 text-center text-sm mb-8">Start free. Upgrade when you&apos;re ready.</p>
        <div className="flex flex-col gap-4">
          {/* Free */}
          <div className="p-5 rounded-2xl border" style={{ background: "#111827", borderColor: "#374151" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-black text-xl">Free</h3>
              <span className="text-2xl font-black text-white">$0</span>
            </div>
            <ul className="space-y-2 mb-5">
              {[
                "10 tokens / week",
                "1 analysis / week",
                "Basic swing history",
                "Full drill library",
              ].map((f) => (
                <li key={f} className="text-gray-300 text-sm flex items-center gap-2">
                  <span style={{ color: "#10B981" }}>✓</span> {f}
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
          <div className="p-5 rounded-2xl relative overflow-hidden" style={{ background: "#1c1405", border: "2px solid #F59E0B" }}>
            <div
              className="absolute top-3 right-3 text-xs font-black px-2 py-1 rounded-full"
              style={{ background: "#F59E0B", color: "#0A0F1E" }}
            >
              POPULAR
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-xl" style={{ color: "#F59E0B" }}>Premium</h3>
              <div className="text-right">
                <span className="text-2xl font-black text-white">$14.99</span>
                <span className="text-gray-400 text-xs">/mo</span>
              </div>
            </div>
            <ul className="space-y-2 mb-5">
              {[
                "200 tokens / week",
                "Unlimited analyses",
                "Full swing dashboard",
                "Drill tracking",
                "Progress reports",
                "Priority AI processing",
              ].map((f) => (
                <li key={f} className="text-gray-300 text-sm flex items-center gap-2">
                  <span style={{ color: "#F59E0B" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="block w-full py-3 rounded-full text-center font-black text-sm"
              style={{ background: "#F59E0B", color: "#0A0F1E" }}
            >
              Go Premium ⚡
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 max-w-sm mx-auto text-center border-t" style={{ borderColor: "#1f2937" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">⚾</span>
          <span className="text-white font-black">NextSport</span>
        </div>
        <p className="text-gray-500 text-xs">
          © {new Date().getFullYear()} NextSport. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
