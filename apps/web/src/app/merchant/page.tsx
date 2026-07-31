const merchants = [
  { name: "Naivas", status: "Verified", skus: 10, promo: "KES 20 cashback" },
  { name: "Quickmart", status: "Verified", skus: 10, promo: "KES 30 cashback" },
  { name: "Carrefour", status: "Verified", skus: 10, promo: "KES 45 cashback" },
];

export default function MerchantPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-savr-clay">Merchant portal</p>
        <h1 className="mt-2 font-display text-4xl">Compete on value</h1>
        <p className="mt-2 max-w-xl text-savr-ink/70">
          Thin Phase 1 shell — register, upload prices, issue cashback. Full auth CRUD wires to
          Supabase merchant_members next.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-savr-ink/20 text-savr-ink/60">
            <tr>
              <th className="py-2 font-medium">Merchant</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Seed SKUs</th>
              <th className="py-2 font-medium">Active promo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-savr-ink/10">
            {merchants.map((m) => (
              <tr key={m.name}>
                <td className="py-3 font-display text-lg">{m.name}</td>
                <td className="py-3">{m.status}</td>
                <td className="py-3">{m.skus}</td>
                <td className="py-3 text-savr-forest">{m.promo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="max-w-md space-y-3 border border-dashed border-savr-ink/20 bg-white/40 p-4">
        <p className="font-semibold">Request merchant access</p>
        <input
          placeholder="Business name"
          className="w-full border border-savr-ink/15 bg-white px-3 py-2"
        />
        <input
          placeholder="Work email"
          type="email"
          className="w-full border border-savr-ink/15 bg-white px-3 py-2"
        />
        <button
          type="button"
          className="bg-savr-forest px-4 py-2 text-sm font-semibold text-white"
        >
          Join waitlist
        </button>
      </form>
    </div>
  );
}
