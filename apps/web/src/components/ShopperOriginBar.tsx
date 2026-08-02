"use client";

import {
  NAIROBI_ESTATES,
  originHint,
  type NairobiEstate,
  type OriginSource,
} from "@/lib/geo";

export function ShopperOriginBar({
  label,
  source,
  busy,
  error,
  useMyLocation,
  setEstate,
  estates = NAIROBI_ESTATES,
}: {
  label: string;
  source: OriginSource;
  busy: boolean;
  error: string | null;
  useMyLocation: () => void;
  setEstate: (estate: NairobiEstate) => void;
  estates?: NairobiEstate[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {estates.map((estate) => {
          const active = source === "estate" && label === estate.label;
          return (
            <button
              key={estate.label}
              type="button"
              onClick={() => setEstate(estate)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                active
                  ? "chip-active"
                  : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
              }`}
            >
              {estate.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-60 ${
            source === "device"
              ? "chip-active"
              : "bg-white text-savr-forest ring-1 ring-savr-forest/25 hover:bg-savr-mist"
          }`}
        >
          {busy ? "Locating…" : source === "device" ? "My GPS" : "Use GPS"}
        </button>
      </div>
      <p className="text-xs text-savr-mute">{originHint(source, label)}</p>
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
