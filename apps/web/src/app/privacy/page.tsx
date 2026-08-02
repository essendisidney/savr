import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

export default function PrivacyPage() {
  return (
    <PageFrame>
      <PageHero
        theme="account"
        title="Privacy"
        subtitle="What we collect, and why."
      />
      <div className="page-band">
        <PageShell narrow>
          <article className="space-y-5 text-sm leading-relaxed text-savr-ink/90">
            <p>
              Savr processes personal data to run compare, wallet, and auth features.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">What we collect</h2>
            <ul className="list-disc space-y-2 pl-5 text-savr-ink/85">
              <li>Account identifiers: phone and/or email, optional name and city.</li>
              <li>Shopping lists, compares, preferred stores, and wallet ledger entries.</li>
              <li>Price tips you submit.</li>
              <li>Technical logs needed for SMS OTP, security, and reliability.</li>
              <li>
                Optional device location if you share it for distance/directions (not stored as a
                profile field by default).
              </li>
              <li>Anonymous product analytics (page views and key actions) via Vercel.</li>
            </ul>
            <h2 className="font-display text-lg font-bold tracking-tightish">Why</h2>
            <p>
              To authenticate you, rank baskets/rides/fuel, credit cashback, keep the catalog fresh,
              and keep the service secure.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Processors</h2>
            <p>
              We use Supabase (auth/database), Vercel (hosting/analytics), and Taifa Mobile (SMS OTP).
              They process data under their terms to provide those services.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Retention & rights</h2>
            <p>
              You can request access or deletion of your account data via Support. We keep ledger and
              security logs as needed to prevent abuse. Kenya Data Protection Act rights may apply.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Children</h2>
            <p>Savr is not directed at children under 16.</p>
            <p>
              See also{" "}
              <Link href="/terms" className="font-semibold text-savr-forest hover:underline">
                Terms of use
              </Link>
              .
            </p>
            <p className="text-xs text-savr-mute">Last updated: August 2026 · Nairobi, Kenya</p>
          </article>
        </PageShell>
      </div>
    </PageFrame>
  );
}
