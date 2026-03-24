"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home", emoji: "🏠" },
  { href: "/analyze", label: "Analyze", emoji: "⚾" },
  { href: "/drills", label: "Drills", emoji: "🏋️" },
  { href: "/profile", label: "Profile", emoji: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ background: "#111827", borderColor: "#1f2937" }}
    >
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-3 px-4 min-w-[60px] transition-all"
              style={{ color: isActive ? "#F59E0B" : "#9ca3af" }}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
