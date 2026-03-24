"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TokenBadge from "@/components/TokenBadge";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  player_name: string | null;
  role: string;
  age_group: string | null;
  sport: string;
  level: string | null;
  referral_code: string;
}

interface TokenTx {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tokenBalance, setTokenBalance] = useState(10);
  const [transactions, setTransactions] = useState<TokenTx[]>([]);
  const [subscription, setSubscription] = useState<{ plan: string; status: string } | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setUserEmail(user.email || "");

      const [profileRes, tokenRes, txRes, subRes, refRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("token_balances").select("balance").eq("user_id", user.id).single(),
        supabase.from("token_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).single(),
        supabase.from("referrals").select("id", { count: "exact" }).eq("referrer_id", user.id).eq("status", "completed"),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (tokenRes.data) setTokenBalance(tokenRes.data.balance);
      if (txRes.data) setTransactions(txRes.data);
      if (subRes.data) setSubscription(subRes.data);
      if (refRes.count !== null) setReferralCount(refRes.count);
      setLoading(false);
    };
    load();
  }, [router]);

  const referralLink = profile?.referral_code
    ? `${process.env.NEXT_PUBLIC_APP_URL || "https://nextsport.vercel.app"}/signup?ref=${profile.referral_code}`
    : "";

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";
  const displayName = profile?.player_name || userEmail.split("@")[0] || "Slugger";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0F1E" }}>
        <div className="text-4xl animate-bounce">⚾</div>
      </div>
    );
  }

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

      <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
        {/* Profile Header */}
        <div className="p-5 rounded-2xl text-center" style={{ background: "#111827" }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3"
            style={{ background: "#1f2937" }}
          >
            👤
          </div>
          <h2 className="text-white font-black text-xl">{displayName}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{userEmail}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {isPremium ? (
              <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: "#1c1405", color: "#F59E0B", border: "1px solid #F59E0B" }}>
                ⚡ PREMIUM
              </span>
            ) : (
              <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: "#111827", color: "#9ca3af", border: "1px solid #374151" }}>
                Free Plan
              </span>
            )}
            {profile?.sport && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#1f2937", color: "#9ca3af" }}>
                {profile.sport === "baseball" ? "⚾" : "🥎"} {profile.age_group} • {profile.level}
              </span>
            )}
          </div>
        </div>

        {/* Token Balance */}
        <div className="p-5 rounded-2xl" style={{ background: "#111827" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Token Balance</h3>
            <span className="text-3xl font-black" style={{ color: "#F59E0B" }}>⚡ {tokenBalance}</span>
          </div>
          {transactions.length > 0 && (
            <div className="space-y-2 border-t pt-3" style={{ borderColor: "#374151" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Activity</p>
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <span className="text-gray-300 text-xs">{tx.description || tx.type}</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: tx.amount > 0 ? "#10B981" : "#F59E0B" }}
                  >
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referral Section */}
        <div className="p-5 rounded-2xl" style={{ background: "#111827" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎁</span>
            <h3 className="text-white font-bold">Refer Friends</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Earn <span style={{ color: "#F59E0B" }} className="font-bold">30 tokens</span> for each friend who analyzes their first swing
          </p>

          {referralLink && (
            <div className="flex gap-2 mb-3">
              <div
                className="flex-1 px-3 py-2 rounded-xl text-xs text-gray-400 truncate"
                style={{ background: "#1f2937", border: "1px solid #374151" }}
              >
                {referralLink}
              </div>
              <button
                onClick={copyReferralLink}
                className="px-3 py-2 rounded-xl text-xs font-bold shrink-0"
                style={{ background: copied ? "#052e16" : "#F59E0B", color: copied ? "#10B981" : "#0A0F1E" }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          )}

          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: "#F59E0B" }}>{referralCount}</p>
              <p className="text-gray-500 text-xs">Friends joined</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: "#10B981" }}>{referralCount * 30}</p>
              <p className="text-gray-500 text-xs">Tokens earned</p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        {!isPremium && (
          <div
            className="p-5 rounded-2xl"
            style={{ background: "#1c1405", border: "2px solid #F59E0B33" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚡</span>
              <h3 className="font-bold" style={{ color: "#F59E0B" }}>Upgrade to Premium</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              200 tokens/week, unlimited analyses, full dashboard & drill tracking
            </p>
            <Link
              href="/pricing"
              className="block w-full py-3 rounded-full font-black text-sm text-center"
              style={{ background: "#F59E0B", color: "#0A0F1E" }}
            >
              Go Premium — $14.99/mo ⚡
            </Link>
          </div>
        )}

        {isPremium && (
          <div className="p-4 rounded-2xl" style={{ background: "#052e16", border: "1px solid #10B981" }}>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <div>
                <p className="text-white font-bold text-sm">Premium Active</p>
                <p className="text-gray-400 text-xs">200 tokens/week • Unlimited analyses</p>
              </div>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 rounded-full font-bold text-sm border"
          style={{ borderColor: "#374151", color: "#9ca3af" }}
        >
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
