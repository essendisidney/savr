"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const DESKTOP = [
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
  },
  {
    href: "/map",
    label: "Nearby",
    match: (p: string) =>
      p.startsWith("/map") || p.startsWith("/fuel") || p.startsWith("/rides"),
  },
  { href: "/saved", label: "Saved", match: (p: string) => p.startsWith("/saved") },
];

export function AppNav() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-savr-ink/[0.07] bg-white/95 text-savr-ink backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-[1.55rem] font-extrabold leading-none tracking-brand text-savr-ink">
            Savr
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
            Kenya
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 text-[13px] font-medium md:flex">
            {DESKTOP.map((l) => {
              const active = l.match(pathname);
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
                  className={`rounded-xl px-3 py-1.5 text-[13px] font-semibold transition ${
                    pathname.startsWith("/account") ||
                    pathname.startsWith("/wallet") ||
                    pathname.startsWith("/scan")
                      ? "bg-savr-forest/10 text-savr-forest"
                      : "text-savr-forest hover:text-savr-ink"
                  }`}
                >
                  You
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="hidden text-[13px] font-semibold text-savr-mute hover:text-savr-ink sm:inline"
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
