"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/PageShell";

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/basket");
  }, [user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err =
      mode === "in" ? await signIn(email, password) : await signUp(email, password, fullName);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/basket");
  }

  return (
    <PageShell narrow>
      <div className="animate-rise space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-savr-forest">Account</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
            {mode === "in" ? "Welcome back" : "Join Savr"}
          </h1>
          <p className="mt-2 text-sm text-savr-ink/65">
            Unlock wallet cashback when you pick the smarter deal.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "up" && (
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full border border-savr-ink/10 bg-white/70 px-4 py-3 outline-none focus:border-savr-forest"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border border-savr-ink/10 bg-white/70 px-4 py-3 outline-none focus:border-savr-forest"
          />
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-savr-ink/10 bg-white/70 px-4 py-3 outline-none focus:border-savr-forest"
          />
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>

        {error && <p className="text-sm font-medium text-red-700">{error}</p>}

        <button
          type="button"
          className="text-sm font-semibold text-savr-forest"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "New here? Create an account" : "Already saving? Sign in"}
        </button>

        <Link href="/basket" className="block text-sm text-savr-ink/50 hover:text-savr-forest">
          Skip — just compare for now
        </Link>
      </div>
    </PageShell>
  );
}
