import { NextResponse } from "next/server";

export const revalidate = 3600;

export type EpraBoard = {
  town: string;
  petrolCents: number;
  dieselCents: number;
  keroseneCents: number;
  validFrom: string | null;
  validTo: string | null;
  source: "epra";
};

type FuelKenyaRow = {
  town?: string;
  super_petrol?: number;
  diesel?: number;
  kerosene?: number;
  valid_from?: string;
  valid_to?: string;
};

function toCents(kes: number | undefined): number | null {
  if (typeof kes !== "number" || !Number.isFinite(kes) || kes < 50 || kes > 500) return null;
  return Math.round(kes * 100);
}

export async function GET() {
  try {
    const res = await fetch("https://api.fuelkenya.com/v1/prices/latest?town=Nairobi", {
      headers: { accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "EPRA feed unavailable" }, { status: 502 });
    }
    const rows = (await res.json()) as FuelKenyaRow[];
    const nairobi =
      rows.find((r) => (r.town ?? "").toLowerCase() === "nairobi") ?? rows[0];
    if (!nairobi) {
      return NextResponse.json({ error: "No Nairobi EPRA row" }, { status: 502 });
    }
    const petrolCents = toCents(nairobi.super_petrol);
    const dieselCents = toCents(nairobi.diesel);
    const keroseneCents = toCents(nairobi.kerosene);
    if (!petrolCents || !dieselCents || !keroseneCents) {
      return NextResponse.json({ error: "EPRA row incomplete" }, { status: 502 });
    }
    const board: EpraBoard = {
      town: nairobi.town ?? "Nairobi",
      petrolCents,
      dieselCents,
      keroseneCents,
      validFrom: nairobi.valid_from ?? null,
      validTo: nairobi.valid_to ?? null,
      source: "epra",
    };
    return NextResponse.json(board);
  } catch {
    return NextResponse.json({ error: "EPRA feed failed" }, { status: 502 });
  }
}
