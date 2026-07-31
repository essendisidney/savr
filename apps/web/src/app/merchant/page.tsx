"use client";

import { PageShell } from "@/components/PageShell";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { formatKes } from "@/lib/compare";

type Row = {
  name: string;
  verified: boolean;
  skus: number;
  cashbackCents: number;
};

export default function MerchantPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [source, setSource] = useState("…");

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      if (!supabase) {
        setSource("fallback");
        setRows([
          { name: "Naivas", verified: true, skus: 10, cashbackCents: 2000 },
          { name: "Quickmart", verified: true, skus: 10, cashbackCents: 3000 },
          { name: "Carrefour", verified: true, skus: 10, cashbackCents: 4500 },
        ]);
        return;
      }

      const { data: merchants } = await supabase
        .from("merchants")
        .select("id, name, is_verified, category")
        .in("category", ["grocery", "fuel", "ride_partner"])
        .order("name");

      if (!merchants?.length) {
        setSource("fallback");
        return;
      }

      const { data: prices } = await supabase.from("merchant_prices").select("merchant_id");
      const { data: rules } = await supabase
        .from("cashback_rules")
        .select("merchant_id, flat_cents")
        .eq("is_active", true);

      const skuCount = new Map<string, number>();
      for (const p of prices ?? []) {
        skuCount.set(p.merchant_id, (skuCount.get(p.merchant_id) ?? 0) + 1);
      }
      const cashback = new Map<string, number>();
      for (const r of rules ?? []) {
        cashback.set(r.merchant_id, r.flat_cents ?? 0);
      }

      setSource("supabase");
      setRows(
        merchants.map((m) => ({
          name: m.name,
          verified: m.is_verified,
          skus: skuCount.get(m.id) ?? 0,
          cashbackCents: cashback.get(m.id) ?? 0,
        })),
      );
    }
    load();
  }, []);

  return (
    <PageShell>
      <div className="animate-rise space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-savr-forest">
            Merchant portal
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
            Compete on value
          </h1>
          <p className="mt-2 max-w-xl text-savr-ink/65">
            Live merchant network · {source}. Price uploads for merchant admins next.
          </p>
        </div>

        <div className="overflow-x-auto bg-white/50">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-savr-ink/15 text-savr-ink/45">
              <tr>
                <th className="px-3 py-3 font-semibold">Merchant</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">SKUs priced</th>
                <th className="px-3 py-3 font-semibold">Cashback rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-savr-ink/10">
              {rows.map((m) => (
                <tr key={m.name}>
                  <td className="px-3 py-3.5 font-display text-lg font-bold">{m.name}</td>
                  <td className="px-3 py-3.5">{m.verified ? "Verified" : "Pending"}</td>
                  <td className="px-3 py-3.5">{m.skus}</td>
                  <td className="px-3 py-3.5 font-semibold text-savr-forest">
                    {m.cashbackCents ? formatKes(m.cashbackCents) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
