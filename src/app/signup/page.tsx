"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        data: { referral_code: refCode || undefined },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If we have a referral code, record it after signup
    if (refCode && authData.user) {
      // Look up the referrer by code
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", refCode)
        .single();

      if (referrer && referrer.id !== authData.user.id) {
        // Update the new user's profile with referred_by
        await supabase
          .from("profiles")
          .update({ referred_by: referrer.id })
          .eq("id", authData.user.id);

        // Create a pending referral record
        await supabase.from("referrals").insert({
          referrer_id: referrer.id,
          referred_id: authData.user.id,
          status: "pending",
          reward_issued: false,
        });
      }
    }

    setSuccess(true);
    setLoading(false);
    // If email confirmation is disabled, redirect immediately
    setTimeout(() => router.push(refCode ? `/onboarding?ref=${refCode}` : "/onboarding"), 1000);
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    // Store ref code in localStorage so we can process after OAuth redirect
    if (refCode) {
      localStorage.setItem("nextsport_ref", refCode);
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/onboarding${refCode ? `&ref=${refCode}` : ""}`,
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0F1E" }}>
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-black text-white mb-2">Account created!</h2>
          <p className="text-gray-400 text-sm">Redirecting you to setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-12" style={{ background: "#0A0F1E" }}>
      <div className="max-w-sm w-full mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl">⚾</span>
            <span className="text-2xl font-black text-white">NextSport</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">Create your free account</p>
        </div>

        {/* Referral banner */}
        {refCode && (
          <div
            className="p-3 rounded-2xl flex items-center gap-3 mb-5"
            style={{ background: "#0c1a2e", border: "1px solid #1d4ed8" }}
          >
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-white text-sm font-bold">You were referred!</p>
              <p className="text-gray-400 text-xs">Sign up and your friend earns 30 bonus tokens</p>
            </div>
          </div>
        )}

        {/* Google Button */}
        <button
          onClick={handleGoogleSignup}
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
        <form onSubmit={handleEmailSignup} className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none focus:ring-2"
              style={{
                background: "#111827",
                border: "1px solid #374151",
                "--tw-ring-color": "#F59E0B",
              } as React.CSSProperties}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-4 rounded-2xl text-white text-sm outline-none focus:ring-2"
              style={{
                background: "#111827",
                border: "1px solid #374151",
                "--tw-ring-color": "#F59E0B",
              } as React.CSSProperties}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-black text-sm disabled:opacity-50"
            style={{ background: "#F59E0B", color: "#0A0F1E" }}
          >
            {loading ? "Creating account..." : "Create Free Account ⚾"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#F59E0B" }} className="font-semibold">
            Log in
          </Link>
        </p>

        <p className="text-center text-gray-600 text-xs mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
        <div className="text-4xl animate-bounce">⚾</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
