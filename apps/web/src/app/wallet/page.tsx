import { formatKes } from "@/lib/compare";

const ledger = [
  { note: "Basket compare · Carrefour", amount: 4500, when: "Today" },
  { note: "Ride · Bolt to Airport", amount: 2000, when: "Yesterday" },
  { note: "Fuel · Total Kilimani", amount: 1500, when: "Mon" },
];

export default function WalletPage() {
  const balance = ledger.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-savr-clay">Savr Wallet</p>
        <h1 className="mt-2 font-display text-4xl">Savings cashback</h1>
        <p className="mt-2 text-savr-ink/70">
          Reward smart decisions. Redemption via M-Pesa lands after payment partners.
        </p>
      </div>

      <div className="border border-savr-forest/30 bg-savr-mint/40 px-6 py-8">
        <p className="text-sm uppercase tracking-wide text-savr-forest">Available</p>
        <p className="mt-2 font-display text-5xl">{formatKes(balance)}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-savr-ink/60">Ledger</h2>
        <ul className="mt-3 divide-y divide-savr-ink/10 border-y border-savr-ink/10">
          {ledger.map((e) => (
            <li key={e.note} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{e.note}</p>
                <p className="text-savr-ink/50">{e.when}</p>
              </div>
              <p className="font-semibold text-savr-forest">+{formatKes(e.amount)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
