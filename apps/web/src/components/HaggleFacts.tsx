"use client";

import { useState } from "react";
import { buildHaggleShare, whatsAppShareUrl } from "@/lib/share";
import { track } from "@/lib/track";

/** Gikomba / street haggle using listed facts — never a made-up wholesale %. */
export function HaggleFacts({
  itemName,
  listedLabel,
  highLabel,
  path,
}: {
  itemName: string;
  listedLabel: string;
  highLabel?: string | null;
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const script = highLabel
    ? `Savr listed “${itemName}” from ${listedLabel} up to ${highLabel}. I’ll pay cash if you can beat the cheapest listed — confirm in person.`
    : `Savr listed “${itemName}” at ${listedLabel}. I’ll pay cash if you can beat that — confirm in person.`;
  const share = buildHaggleShare({ itemName, listedLabel, path });

  return (
    <div className="rounded-2xl border border-savr-ink/10 bg-white px-4 py-3">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) track("haggle_open", { item: itemName.slice(0, 80) });
        }}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold text-savr-ink">Haggling in person?</span>
        <span className="shrink-0 text-xs font-semibold text-savr-forest">
          {open ? "Hide" : "Use listed facts"}
        </span>
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm leading-relaxed text-savr-mute">
            Savr does not invent a Gikomba wholesale floor. Show the seller a real listed price from
            this compare — not a 25% “bargain generator.” They may still say no.
          </p>
          <p className="rounded-xl bg-savr-fog px-3 py-2 text-sm leading-relaxed text-savr-ink">
            “{script}”
          </p>
          <a
            href={whatsAppShareUrl(share)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("share_save", { via: "whatsapp_haggle", item: itemName.slice(0, 80) })}
            className="btn-ghost inline-flex py-2 text-sm"
          >
            WhatsApp this script
          </a>
        </div>
      ) : null}
    </div>
  );
}
