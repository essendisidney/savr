"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function AppNav() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const onHero = pathname === "/";

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        onHero
          ? "border-b border-transparent bg-transparent text-white"
          : "border-b border-savr-ink/[0.06] bg-savr-mist/90 text-savr-ink backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link
          href="/"
          className={`font-display text-[1.65rem] font-extrabold leading-none tracking-brand ${
            onHero ? "text-white" : "text-savr-ink"
          }`}
        >
          Savr
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 text-[13px] font-medium md:flex">
            {[
              { href: "/basket", label: "Basket" },
              { href: "/rides", label: "Rides" },
              { href: "/fuel", label: "Fuel" },
              { href: "/wallet", label: "Wallet" },
            ].map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 transition ${
                    onHero
                      ? active
                        ? "text-savr-signal"
                        : "text-white/70 hover:text-white"
                      : active
                        ? "text-savr-forest"
                        : "text-savr-mute hover:text-savr-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {!loading &&
            (user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className={`text-[13px] font-semibold ${
                  onHero ? "text-white/80 hover:text-white" : "text-savr-mute hover:text-savr-ink"
                }`}
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className={`text-[13px] font-semibold ${
                  onHero ? "text-savr-signal" : "text-savr-forest"
                }`}
              >
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
