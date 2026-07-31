"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/basket", label: "Basket" },
  { href: "/rides", label: "Rides" },
  { href: "/fuel", label: "Fuel" },
  { href: "/wallet", label: "Wallet" },
];

export function AppNav() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const onHero = pathname === "/";

  return (
    <header
      className={`sticky top-0 z-40 transition ${
        onHero
          ? "border-b border-white/10 bg-savr-night/40 text-white backdrop-blur-md"
          : "border-b border-savr-ink/8 bg-savr-mist/85 text-savr-ink backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href="/"
          className={`font-display text-2xl font-extrabold tracking-tight ${onHero ? "text-white" : "text-savr-ink"}`}
        >
          Savr
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm md:gap-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2.5 py-1.5 transition ${
                  onHero
                    ? active
                      ? "text-savr-signal"
                      : "text-white/75 hover:text-white"
                    : active
                      ? "font-semibold text-savr-forest"
                      : "text-savr-ink/65 hover:text-savr-forest"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/merchant"
            className={`hidden px-2.5 py-1.5 sm:inline ${
              onHero ? "text-white/60 hover:text-white" : "text-savr-ink/50 hover:text-savr-forest"
            }`}
          >
            Merchants
          </Link>
          {!loading &&
            (user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className={`ml-1 px-2.5 py-1.5 ${onHero ? "text-savr-signal" : "text-savr-forest"}`}
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className={`ml-1 font-semibold ${onHero ? "text-savr-signal" : "text-savr-forest"}`}
              >
                Sign in
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
