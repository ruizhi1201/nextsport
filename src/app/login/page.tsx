"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-12" style={{ background: "#0A0F1E" }}>
      <div className="max-w-sm w-full mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl">⚾</span>
            <span className="text-2xl font-black text-white">NextSport</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">Welcome back, Coach 👋</p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-3 mb-4 transition-opacity hover:opacity-90"
          style={{ background: "#111827", color: "white", border: "1px solid #374151" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "#374151" }} />
          <span className="text-gray-500 text-xs">or</span>
          <div className="flex-1 h-px" style={{ background: "#374151" }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none"
            style={{ background: "#111827", border: "1px solid #374151" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none"
            style={{ background: "#111827", border: "1px solid #374151" }}
          />

          {error && (
            <p className="text-sm text-red-400 px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-black text-sm disabled:opacity-50"
            style={{ background: "#F59E0B", color: "#0A0F1E" }}
          >
            {loading ? "Signing in..." : "Sign In ⚾"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-4">
          <Link href="/signup" style={{ color: "#F59E0B" }} className="font-semibold">
            Forgot password?
          </Link>
        </p>

        <p className="text-center text-gray-500 text-xs mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#F59E0B" }} className="font-semibold">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
