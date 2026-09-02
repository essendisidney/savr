"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { ListingCard } from "@/components/ListingCard";
import { LoadingBlock } from "@/components/LoadingBlock";
import { useAuth } from "@/lib/auth";
import {
  dealStatusLabel,
  formatKes,
  type MarketplaceDeal,
  type MarketplaceListing,
} from "@/lib/marketplace";
import {
  loadMyDeals,
  loadMyListings,
  loadVerificationStatus,
  requestVerification,
} from "@/lib/marketplace-actions";
import { loadProfile, saveProfile, type UserProfile } from "@/lib/actions";

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [deals, setDeals] = useState<MarketplaceDeal[]>([]);
  const [verify, setVerify] = useState<"none" | "pending" | "verified" | "rejected">("none");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void (async () => {
      const [p, mine, myDeals, v] = await Promise.all([
        loadProfile(),
        loadMyListings(),
        loadMyDeals(),
        loadVerificationStatus(),
      ]);
      if (!("error" in p)) setProfile(p);
      setListings(mine);
      setDeals(myDeals);
      setVerify(v);
      setLoading(false);
    })();
  }, [user, authLoading]);

  async function onSaveProfile() {
    if (!profile) return;
    setBusy(true);
    const res = await saveProfile(profile);
    setBusy(false);
    setStatus(res.error ?? "Profile saved");
  }

  async function onVerify() {
    setBusy(true);
    const res = await requestVerification();
    setBusy(false);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    setVerify("pending");
    setStatus("Verification requested — we’ll review your ID.");
  }

  if (loading || authLoading) {
    return (
      <PageFrame>
        <div className="h-28 animate-pulse bg-savr-fog/80" />
        <PageShell>
          <LoadingBlock rows={4} />
        </PageShell>
      </PageFrame>
    );
  }

  if (!user) {
    return (
      <PageFrame>
        <PageHero theme="account" title="You" subtitle="Sign in to sell, buy, and manage deals." />
        <PageShell narrow>
          <Link href="/login?next=/account" className="btn-primary inline-flex">
            Sign in
          </Link>
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero theme="account" title="You" subtitle="Listings, deals, and seller trust." />
      <PageShell>
        <div className="space-y-8">
          <section className="card space-y-3 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
              Profile
            </p>
            <input
              className="field"
              value={profile?.fullName ?? ""}
              onChange={(e) =>
                profile && setProfile({ ...profile, fullName: e.target.value })
              }
              placeholder="Display name"
            />
            <input
              className="field"
              value={profile?.phone ?? ""}
              onChange={(e) => profile && setProfile({ ...profile, phone: e.target.value })}
              placeholder="M-Pesa phone 07…"
            />
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => void onSaveProfile()}>
              Save profile
            </button>
          </section>

          <section className="card space-y-3 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
              Seller verification
            </p>
            <p className="text-sm text-savr-ink">
              Status:{" "}
              <span className="font-semibold">
                {verify === "none" ? "Not verified" : verify}
              </span>
            </p>
            {verify === "none" || verify === "rejected" ? (
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void onVerify()}>
                Request ✅ badge
              </button>
            ) : null}
            <p className="text-xs text-savr-mute">Optional. Builds buyer confidence. Fee later.</p>
          </section>

          {status && <p className="text-sm font-semibold text-savr-forest">{status}</p>}

          <section>
            <div className="flex items-baseline justify-between">
              <p className="page-eyebrow">My listings</p>
              <Link href="/sell" className="text-xs font-semibold text-savr-forest">
                Post →
              </Link>
            </div>
            {listings.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-savr-mute">No listings yet.</p>
            )}
          </section>

          <section>
            <p className="page-eyebrow">My deals</p>
            <ul className="mt-3 space-y-2">
              {deals.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/deals/${d.id}`}
                    className="card flex items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <span>
                      <span className="block font-semibold text-savr-ink">{d.listingTitle}</span>
                      <span className="text-[13px] text-savr-mute">
                        {dealStatusLabel(d.status)} · {formatKes(d.priceCents)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-savr-forest">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            {!deals.length && <p className="mt-3 text-sm text-savr-mute">No deals yet.</p>}
          </section>

          <button
            type="button"
            onClick={() => signOut()}
            className="text-sm font-semibold text-savr-mute hover:text-savr-ink"
          >
            Sign out
          </button>
        </div>
      </PageShell>
    </PageFrame>
  );
}
