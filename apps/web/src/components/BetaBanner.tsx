"use client";

import Link from "next/link";
import { supportMailto, supportWhatsAppUrl } from "@/lib/support";

export function BetaBanner() {
  const wa = supportWhatsAppUrl();
  return (
    <div className="border-b border-savr-signal/30 bg-savr-night px-4 py-2 text-center text-xs text-white/90 md:text-[13px]">
      <span className="font-medium">
        Nairobi beta · prices may lag · cashback redeem pending M-Pesa
      </span>
      <span className="mx-2 text-white/35">·</span>
      <a href={supportMailto()} className="font-semibold text-savr-signal hover:underline">
        Support
      </a>
      {wa && (
        <>
          <span className="mx-1.5 text-white/35">·</span>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-savr-signal hover:underline"
          >
            WhatsApp
          </a>
        </>
      )}
      <span className="mx-2 text-white/35">·</span>
      <Link href="/terms" className="font-semibold text-white/75 hover:text-white hover:underline">
        Terms
      </Link>
    </div>
  );
}
