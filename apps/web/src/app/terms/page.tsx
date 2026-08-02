import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

export default function TermsPage() {
  return (
    <PageFrame>
      <PageHero
        theme="account"
        title="Terms of use"
        subtitle="Plain-language terms for shoppers and merchants on Savr."
      />
      <div className="page-band">
        <PageShell narrow>
          <article className="prose-savr space-y-5 text-sm leading-relaxed text-savr-ink/90">
            <p>
              Savr (“we”) helps you compare grocery baskets, ride fares, and fuel prices in Nairobi
              before you spend. By using https://savr-teal.vercel.app or related apps, you agree to
              these terms.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Service</h2>
            <p>
              Savr ranks options using available catalog and quote data. Always confirm final prices
              and fares with the store or partner app before you pay.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Accounts & SMS</h2>
            <p>
              You may sign in with phone OTP (SMS), email magic link, or password. You are
              responsible for the phone/email you use. OTP messages come from our SMS provider;
              message and data rates may apply.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Cashback</h2>
            <p>
              Wallet cashback is earned when you lock a smarter basket choice per our rules. Redeem
              requests are paid to your M-Pesa number after processing. Balances are not a bank
              deposit and may be adjusted for abuse or errors.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Price tips</h2>
            <p>
              Shoppers may tip shelf or pump prices. Tips must be honest observations. We may remove
              tips that look abusive or wrong.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Merchants</h2>
            <p>
              Merchant admins may upload prices and promotions. You warrant you have rights to the
              data you publish and that it is not misleading.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Liability</h2>
            <p>
              To the fullest extent allowed by Kenyan law, Savr is provided “as is” without warranties
              of accuracy or uninterrupted service. We are not liable for shopping, transport, or fuel
              decisions you make after using Savr.
            </p>
            <h2 className="font-display text-lg font-bold tracking-tightish">Contact</h2>
            <p>
              Questions: see Support on the site footer, or email the address listed there.{" "}
              <Link href="/privacy" className="font-semibold text-savr-forest hover:underline">
                Privacy policy
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
