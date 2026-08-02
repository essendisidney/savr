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
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
        onHero
          ? "border-white/10 bg-savr-night/90 text-white"
          : "border-savr-ink/[0.06] bg-savr-mist/95 text-savr-ink"
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
              { href: "/check", label: "Check" },
              { href: "/prices", label: "Prices" },
              { href: "/map", label: "Map" },
              { href: "/rides", label: "Rides" },
              { href: "/fuel", label: "Fuel" },
              { href: "/wallet", label: "Savings" },
              { href: "/merchant", label: "Merchants" },
            ].map((l) => {
              const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-sm px-3 py-1.5 transition ${
                    onHero
                      ? active
                        ? "bg-white/10 text-savr-signal"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                      : active
                        ? "bg-savr-fog text-savr-forest"
                        : "text-savr-mute hover:bg-savr-fog/70 hover:text-savr-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {!loading &&
            (user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/account"
                  className={`text-[13px] font-semibold ${
                    onHero ? "text-white/90 hover:text-white" : "text-savr-forest"
                  }`}
                >
                  Account
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className={`text-[13px] font-semibold ${
                    onHero ? "text-white/70 hover:text-white" : "text-savr-mute hover:text-savr-ink"
                  }`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(pathname || "/basket")}`}
                className={`text-[13px] font-semibold ${
                  onHero
                    ? "bg-savr-signal px-3 py-1.5 text-savr-ink hover:bg-[#ffd23a]"
                    : "bg-savr-night px-3 py-1.5 text-white hover:bg-savr-ink"
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
