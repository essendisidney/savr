"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/basket", label: "Basket" },
  { href: "/rides", label: "Rides" },
  { href: "/fuel", label: "Fuel" },
  { href: "/wallet", label: "Wallet" },
  { href: "/merchant", label: "Merchants" },
];

export function AppNav() {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="border-b border-savr-ink/10 bg-savr-sand/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-display text-2xl tracking-tight text-savr-ink">
          Savr
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-savr-ink/80">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-savr-forest">
              {l.label}
            </Link>
          ))}
          {!loading &&
            (user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="text-savr-forest transition hover:text-savr-leaf"
              >
                Sign out
              </button>
            ) : (
              <Link href="/login" className="font-semibold text-savr-forest">
                Sign in
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
