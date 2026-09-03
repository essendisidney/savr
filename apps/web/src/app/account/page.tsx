"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { ListingCard } from "@/components/ListingCard";
import { LoadingBlock } from "@/components/LoadingBlock";
import { useAuth } from "@/lib/auth";
import {
  BOOST_KES,
  VERIFY_KES,
  dealStatusLabel,
  formatKes,
  isBoosted,
  type MarketplaceDeal,
  type MarketplaceListing,
} from "@/lib/marketplace";
import {
  boostListing,
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
  const [idNote, setIdNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refreshMine() {
    const [mine, myDeals] = await Promise.all([loadMyListings(), loadMyDeals()]);
    setListings(mine);
    setDeals(myDeals);
  }

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
    const res = await requestVerification({ idNote });
    setBusy(false);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    setVerify("pending");
    setStatus(
      res.dryRun
        ? `Verification pending — KES ${VERIFY_KES} fee stub (dry-run, no charge). Ops will review.`
        : `Verification pending — KES ${VERIFY_KES}. Ops will review your ID note.`,
    );
  }

  async function onBoost(listingId: string) {
    setBusy(true);
    const res = await boostListing(listingId);
    setBusy(false);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    setStatus(
      res.dryRun
        ? `Boosted for 7 days — KES ${BOOST_KES} stub (dry-run, no charge).`
        : `Boosted for 7 days (KES ${BOOST_KES}).`,
    );
    await refreshMine();
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
            <p className="text-xs text-savr-mute">
              Required to post listings and receive escrow payouts.
            </p>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => void onSaveProfile()}>
              Save profile
            </button>
          </section>

          <section className="card space-y-3 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
              Seller verification · KES {VERIFY_KES}
            </p>
            <p className="text-sm text-savr-ink">
              Status:{" "}
              <span className="font-semibold">
                {verify === "none" ? "Not verified" : verify}
              </span>
            </p>
            {(verify === "none" || verify === "rejected") && (
              <>
                <textarea
                  className="field min-h-[4.5rem]"
                  value={idNote}
                  onChange={(e) => setIdNote(e.target.value)}
                  placeholder="ID placeholder — e.g. National ID last 4 digits / upload coming soon"
                  maxLength={200}
                />
                <button type="button" className="btn-primary" disabled={busy} onClick={() => void onVerify()}>
                  Request badge · KES {VERIFY_KES}
                </button>
              </>
            )}
            <p className="text-xs text-savr-mute">
              Stub fee only while M-Pesa is dry-run. Badge stays pending until ops verifies — not
              auto-trust.
            </p>
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
              <ul className="mt-3 space-y-4">
                {listings.map((l) => (
                  <li key={l.id} className="space-y-2">
                    <ListingCard listing={l} />
                    {l.status === "live" || l.status === "reserved" ? (
                      <button
                        type="button"
                        className="btn-ghost w-full text-sm"
                        disabled={busy || isBoosted(l)}
                        onClick={() => void onBoost(l.id)}
                      >
                        {isBoosted(l) ? "Boosted" : `Boost 7 days · KES ${BOOST_KES}`}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
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
