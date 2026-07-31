"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

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
      mode === "in"
        ? await signIn(email, password)
        : await signUp(email, password, fullName);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/basket");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-savr-clay">Account</p>
        <h1 className="mt-2 font-display text-4xl">
          {mode === "in" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-savr-ink/70">
          Needed to save basket choices and credit savings cashback.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "up" && (
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full border border-savr-ink/15 bg-white/70 px-3 py-2"
          />
        )}
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border border-savr-ink/15 bg-white/70 px-3 py-2"
        />
        <input
          required
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-savr-ink/15 bg-white/70 px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-savr-forest px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
        </button>
      </form>

      {error && <p className="text-sm text-savr-clay">{error}</p>}

      <button
        type="button"
        className="text-sm text-savr-forest"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
      >
        {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>

      <p className="text-sm">
        <Link href="/basket" className="text-savr-ink/60 hover:text-savr-forest">
          Continue comparing without signing in
        </Link>
      </p>
    </div>
  );
}
