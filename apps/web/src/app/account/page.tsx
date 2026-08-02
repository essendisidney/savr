"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile, saveProfile, type UserProfile } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import type { Merchant } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("signed_out");
      return;
    }

    Promise.all([loadProfile(), loadCatalog()]).then(([p, catalog]) => {
      if ("error" in p) {
        setError(p.error);
      } else {
        setProfile(p);
      }
      setMerchants(catalog.merchants.filter((m) => m.category === "grocery"));
      setLoading(false);
    });
  }, [user, authLoading]);

  function toggleMerchant(id: string) {
    if (!profile) return;
    const has = profile.preferredMerchantIds.includes(id);
    setProfile({
      ...profile,
      preferredMerchantIds: has
        ? profile.preferredMerchantIds.filter((x) => x !== id)
        : [...profile.preferredMerchantIds, id],
    });
  }

  async function onSave() {
    if (!profile) return;
    setBusy(true);
    setStatus(null);
    const res = await saveProfile(profile);
    setBusy(false);
    if (res.error) {
      setStatus(res.error);
      return;
    }
    setStatus("Profile saved — preferred stores show on basket ranks.");
  }

  if (loading || authLoading) {
    return (
      <PageFrame>
        <div className="h-52 animate-pulse bg-savr-night/80" />
        <PageShell>
          <div className="h-40 animate-pulse bg-savr-fog" />
        </PageShell>
      </PageFrame>
    );
  }

  if (error === "signed_out" || !user) {
    return (
      <PageFrame>
        <PageHero
          theme="account"
          title="Your Savr profile"
          subtitle="Sign in to set your name, city, and preferred stores."
          action={{ href: "/login", label: "Sign in" }}
        />
      </PageFrame>
    );
  }

  if (!profile) {
    return (
      <PageFrame>
        <PageHero theme="account" title="Your Savr profile" subtitle={error ?? "Could not load profile."} />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="account"
        title={profile.fullName.trim() || "Your profile"}
        subtitle={`${profile.city} · tune preferred stores so basket ranks feel personal.`}
      />

      <div className="page-band">
        <PageShell narrow>
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold tracking-tightish">Details</h2>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                  Full name
                </span>
                <input
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="field mt-1.5"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                  City
                </span>
                <input
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="field mt-1.5"
                  placeholder="Nairobi"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                  Phone
                </span>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="field mt-1.5"
                  placeholder="07…"
                  inputMode="tel"
                />
              </label>
              <p className="text-xs text-savr-mute">{user.email}</p>
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tightish">Preferred stores</h2>
                <p className="mt-1 text-sm text-savr-mute">
                  Marked on basket ranks. Use “Preferred only” there to narrow compare — Savr still
                  picks best total value, never silent reorder.
                </p>
              </div>
              <ul className="divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08] bg-white">
                {merchants.map((m) => {
                  const on = profile.preferredMerchantIds.includes(m.id);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => toggleMerchant(m.id)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition ${
                          on ? "bg-savr-night text-white" : "hover:bg-savr-mist"
                        }`}
                      >
                        <span className="font-semibold">{m.name}</span>
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            on ? "text-savr-signal" : "text-savr-mute"
                          }`}
                        >
                          {on ? "Preferred" : "Add"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={onSave}
                className="btn-primary w-full disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save profile"}
              </button>
              {status && <p className="text-sm font-semibold text-savr-forest">{status}</p>}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Link href="/wallet" className="text-sm font-semibold text-savr-forest hover:underline">
                  Saved with Savr →
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-sm font-semibold text-savr-mute hover:text-savr-ink"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
