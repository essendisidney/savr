"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Home",
    match: (p: string) => p === "/",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/ask",
    label: "Ask",
    match: (p: string) =>
      p === "/ask" ||
      p.startsWith("/prices") ||
      p.startsWith("/basket") ||
      p.startsWith("/rides") ||
      p.startsWith("/check"),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle
          cx="11"
          cy="11"
          r="6.5"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
        />
        <path
          d="M16.5 16.5 20 20"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Nearby",
    match: (p: string) => p.startsWith("/map") || p.startsWith("/fuel"),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5 9 4.5Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
        <path
          d="M9 4.5v13M15 6.5v13"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/wallet",
    label: "Wallet",
    match: (p: string) => p.startsWith("/wallet") || p.startsWith("/alerts"),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a2 2 0 0 1 2 2v9.5A2.5 2.5 0 0 1 17.5 20h-12A2.5 2.5 0 0 1 3 17.5v-9Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
        <path
          d="M20 12h-3.5a1.5 1.5 0 0 0 0 3H20"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
        />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "You",
    match: (p: string) =>
      p.startsWith("/account") || p.startsWith("/login") || p.startsWith("/saved"),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle
          cx="12"
          cy="9"
          r="3.25"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
        />
        <path
          d="M5.5 19.2c1.6-2.8 3.9-4.2 6.5-4.2s4.9 1.4 6.5 4.2"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/merchant" || pathname === "/invite" || pathname.startsWith("/l/")) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/50 bg-white/70 shadow-[0_-16px_48px_-28px_rgba(11,18,32,0.35)] backdrop-blur-2xl md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1.5">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold tracking-wide transition ${
                  active ? "text-savr-forest" : "text-savr-mute hover:text-savr-ink"
                }`}
              >
                {tab.icon(active)}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
