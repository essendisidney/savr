import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

export default function TermsPage() {
  return (
    <PageFrame>
      <PageHero
        theme="account"
        title="Terms of use"
        subtitle="Plain-language terms for buyers and sellers on Savr."
      />
      <div className="page-band">
        <PageShell narrow>
          <article className="prose-savr space-y-5 text-sm leading-relaxed text-savr-ink/90">
            <p>
              Savr (“we”) is a Kenya second-hand marketplace: list items, buy with M-Pesa escrow, and
              build reputation. By using https://savr-teal.vercel.app or related apps, you agree to
              these terms.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Service</h2>
            <p>
              Sellers post listings (photo, title, price). Buyers pay into escrow via M-Pesa. Funds
              are released to the seller after the buyer confirms — minus Savr’s platform fee (3% on
              Day 1). Always inspect items when you meet. Savr is the trust rail, not the owner of
              goods listed by users.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Accounts & SMS</h2>
            <p>
              You may sign in with phone OTP (SMS), email magic link, or password. You are
              responsible for the phone/email you use. OTP messages come from our SMS provider;
              message and data rates may apply.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Escrow & fees</h2>
            <p>
              Escrow status is shown in the deal screen. Until live M-Pesa is explicitly enabled,
              payment flows may run in dry-run mode (no real money moved). When live, a fee is
              deducted on release. Disputes: report a problem while funds are held; we may hold,
              refund, or release per our review.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Listings & conduct</h2>
            <p>
              You warrant you have the right to sell what you list, that photos and titles are not
              misleading, and that you will not use Savr for illegal goods, fraud, or harassment.
              We may remove listings or suspend accounts for abuse.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Ratings</h2>
            <p>
              After a deal is released, parties may leave stars and a short note. Ratings must be
              honest; fake or abusive reviews may be removed.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Liability</h2>
            <p>
              To the fullest extent allowed by Kenyan law, Savr is provided “as is” without warranties
              of uninterrupted service. We are not liable for item condition disputes beyond the
              escrow tools we provide, or for decisions you make after using Savr.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Contact</h2>
            <p>
              Questions: see Support on the site footer, or email the address listed there.{" "}
              <Link href="/privacy" className="font-semibold text-savr-forest hover:underline">
                Privacy policy
              </Link>
              .
            </p>
            <p className="text-xs text-savr-mute">Last updated: September 2026 · Nairobi, Kenya</p>
          </article>
        </PageShell>
      </div>
    </PageFrame>
  );
}
