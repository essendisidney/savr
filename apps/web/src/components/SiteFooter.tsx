"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supportEmail, supportMailto, supportWhatsAppUrl } from "@/lib/support";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  const wa = supportWhatsAppUrl();
  return (
    <footer className="relative mt-2 border-t border-savr-ink/[0.07] bg-white/90 px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-lg font-extrabold tracking-brand text-savr-ink">Savr</p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-savr-mute">
            We rank listed Kenya prices. Confirm at the shop.
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
            Compare
          </Link>
          <Link href="/map" className="font-semibold text-savr-mute transition hover:text-savr-forest">
            Nearby
          </Link>
          <Link href="/saved" className="font-semibold text-savr-mute transition hover:text-savr-forest">
            Saved
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
