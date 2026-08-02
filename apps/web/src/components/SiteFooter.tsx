import Link from "next/link";
import { supportEmail, supportMailto, supportWhatsAppUrl } from "@/lib/support";

export function SiteFooter() {
  const wa = supportWhatsAppUrl();
  return (
    <footer className="border-t border-savr-ink/[0.06] bg-white/80 px-4 py-10 backdrop-blur-md md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl font-bold tracking-tightish text-savr-ink">Savr</p>
          <p className="mt-2 max-w-sm text-sm text-savr-mute">
            Before you spend, Savr it. Compare groceries, rides, and fuel across Nairobi.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/terms" className="font-semibold text-savr-mute hover:text-savr-forest">
            Terms
          </Link>
          <Link href="/privacy" className="font-semibold text-savr-mute hover:text-savr-forest">
            Privacy
          </Link>
          <Link href="/basket" className="font-semibold text-savr-mute hover:text-savr-forest">
            Basket
          </Link>
          <a href={supportMailto()} className="font-semibold text-savr-mute hover:text-savr-forest">
            {supportEmail()}
          </a>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-savr-mute hover:text-savr-forest"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
