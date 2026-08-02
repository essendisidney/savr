"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function AppNav() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-savr-ink/[0.06] bg-savr-mist/90 text-savr-ink backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link
          href="/"
          className="font-display text-[1.65rem] font-extrabold leading-none tracking-brand text-savr-ink"
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
                  className={`rounded-xl px-3 py-1.5 transition duration-soft ${
                    active
                      ? "bg-savr-forest/10 text-savr-forest"
                      : "text-savr-mute hover:bg-savr-fog/80 hover:text-savr-ink"
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
                  className="text-[13px] font-semibold text-savr-forest hover:text-savr-ink"
                >
                  Account
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-[13px] font-semibold text-savr-mute hover:text-savr-ink"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(pathname || "/")}`}
                className="rounded-xl bg-savr-forest px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#00b34a]"
              >
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
