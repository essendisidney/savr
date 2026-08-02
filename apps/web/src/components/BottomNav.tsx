"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Home",
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
    href: "/basket",
    label: "Basket",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 8h16l-1.2 11.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 8Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
        <path
          d="M8 8V6a4 4 0 0 1 8 0v2"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/prices",
    label: "Prices",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 7h16M4 12h10M4 17h7"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinecap="round"
        />
        <path
          d="M17 14v6M14 17h6"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/rides",
    label: "Rides",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 13h18l-1.5-5.5A3 3 0 0 0 16.6 5H7.4a3 3 0 0 0-2.9 2.5L3 13Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
        <path d="M5 17h.01M19 17h.01M3 13v3a2 2 0 0 0 2 2h1m12 0h1a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/wallet",
    label: "Savings",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a2 2 0 0 1 2 2v9.5A2.5 2.5 0 0 1 17.5 20h-12A2.5 2.5 0 0 1 3 17.5v-9Z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinejoin="round"
        />
        <path d="M20 12h-3.5a1.5 1.5 0 0 0 0 3H20" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/merchant" || pathname === "/account" || pathname === "/invite" || pathname.startsWith("/l/"))
    return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-savr-ink/[0.07] bg-white/92 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold tracking-wide ${
                  active ? "text-savr-forest" : "text-savr-mute"
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
