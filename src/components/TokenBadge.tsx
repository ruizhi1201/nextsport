"use client";

interface TokenBadgeProps {
  balance: number;
  className?: string;
}

export default function TokenBadge({ balance, className = "" }: TokenBadgeProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${className}`}
      style={{ background: "#F59E0B", color: "#0A0F1E" }}
    >
      <span>⚡</span>
      <span>{balance}</span>
    </div>
  );
}
