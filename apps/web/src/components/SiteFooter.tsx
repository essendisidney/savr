import Link from "next/link";
import { supportEmail, supportMailto, supportWhatsAppUrl } from "@/lib/support";

export function SiteFooter() {
  const wa = supportWhatsAppUrl();
  return (
    <footer className="relative mt-4 border-t border-white/50 bg-white/55 px-4 py-12 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-7 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-brand text-savr-ink">Savr</p>
          <p className="mt-2.5 max-w-sm text-[13px] leading-relaxed text-savr-mute">
            Before you spend, Savr it. Nairobi’s spending OS — compare groceries, rides, and fuel
            before money leaves your wallet.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-[13px]">
          <Link href="/terms" className="font-semibold text-savr-mute transition hover:text-savr-forest">
            Terms
          </Link>
          <Link href="/privacy" className="font-semibold text-savr-mute transition hover:text-savr-forest">
            Privacy
          </Link>
          <Link href="/ask" className="font-semibold text-savr-mute transition hover:text-savr-forest">
            Ask Savr
          </Link>
          <Link href="/basket" className="font-semibold text-savr-mute transition hover:text-savr-forest">
            Basket
          </Link>
          <Link href="/scan" className="font-semibold text-savr-mute transition hover:text-savr-forest">
            Scan
          </Link>
          <a href={supportMailto()} className="font-semibold text-savr-mute transition hover:text-savr-forest">
            {supportEmail()}
          </a>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-savr-mute transition hover:text-savr-forest"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
