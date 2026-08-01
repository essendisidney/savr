"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

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
    <PageFrame>
      <PageHero
        theme="login"
        title={mode === "in" ? "Welcome back" : "Join Savr"}
        subtitle="Unlock wallet cashback when you pick the smarter deal."
      />
      <div className="page-band">
        <PageShell narrow>
          <form onSubmit={onSubmit} className="animate-rise -mt-2 space-y-3">
            {mode === "up" && (
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
              />
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
            />
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
            />
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>

          {error && <p className="mt-4 text-sm font-medium text-red-700">{error}</p>}

          <button
            type="button"
            className="mt-5 text-sm font-semibold text-savr-forest"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? "New here? Create an account" : "Already saving? Sign in"}
          </button>

          <Link href="/basket" className="mt-4 block text-sm text-savr-mute hover:text-savr-forest">
            Skip for now
          </Link>
        </PageShell>
      </div>
    </PageFrame>
  );
}
