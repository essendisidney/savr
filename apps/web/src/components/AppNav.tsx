"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const DESKTOP = [
  { href: "/ask", label: "Ask Savr" },
  { href: "/wallet", label: "Wallet" },
  { href: "/saved", label: "Saved" },
  { href: "/map", label: "Map" },
  { href: "/merchant", label: "Merchants" },
];

export function AppNav() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/55 text-savr-ink shadow-[0_1px_0_rgba(4,36,25,0.04)] backdrop-blur-2xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link
          href="/"
          className="bg-gradient-to-br from-savr-ink via-savr-ink to-savr-forest bg-clip-text font-display text-[1.65rem] font-extrabold leading-none tracking-brand text-transparent"
        >
          Savr
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 text-[13px] font-medium md:flex">
            {DESKTOP.map((l) => {
              const active =
                pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
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
