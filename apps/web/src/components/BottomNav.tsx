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
    label: "Compare",
    match: (p: string) =>
      p === "/ask" ||
      p.startsWith("/prices") ||
      p.startsWith("/basket") ||
      p.startsWith("/market") ||
      p.startsWith("/bundles") ||
      p.startsWith("/check"),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 7h4v4H7V7Zm6 0h4v4h-4V7ZM7 13h4v4H7v-4Zm6 6 4-6h-4v6Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Nearby",
    match: (p: string) =>
      p.startsWith("/map") || p.startsWith("/fuel") || p.startsWith("/rides"),
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
    href: "/saved",
    label: "Saved",
    match: (p: string) => p.startsWith("/saved") || p.startsWith("/alerts"),
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6.5 4.5h11A1.5 1.5 0 0 1 19 6v14l-7-3.5L5 20V6A1.5 1.5 0 0 1 6.5 4.5Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "You",
    match: (p: string) =>
      p.startsWith("/account") ||
      p.startsWith("/login") ||
      p.startsWith("/wallet") ||
      p.startsWith("/scan"),
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-savr-ink/[0.08] bg-white/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1.5 pt-1">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`mx-0.5 flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold tracking-wide transition ${
                  active
                    ? "bg-savr-forest/10 text-savr-forest"
                    : "text-savr-mute hover:text-savr-ink"
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
