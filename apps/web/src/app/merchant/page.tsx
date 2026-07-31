"use client";

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
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-savr-clay">Merchant portal</p>
        <h1 className="mt-2 font-display text-4xl">Compete on value</h1>
        <p className="mt-2 max-w-xl text-savr-ink/70">
          Live merchant network · source: {source}. Upload CRUD comes next for merchant_admins.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-savr-ink/20 text-savr-ink/60">
            <tr>
              <th className="py-2 font-medium">Merchant</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">SKUs priced</th>
              <th className="py-2 font-medium">Cashback rule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-savr-ink/10">
            {rows.map((m) => (
              <tr key={m.name}>
                <td className="py-3 font-display text-lg">{m.name}</td>
                <td className="py-3">{m.verified ? "Verified" : "Pending"}</td>
                <td className="py-3">{m.skus}</td>
                <td className="py-3 text-savr-forest">
                  {m.cashbackCents ? formatKes(m.cashbackCents) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
