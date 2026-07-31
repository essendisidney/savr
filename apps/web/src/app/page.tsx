import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-none pb-4 pt-10 md:pt-16">
        <p className="font-display text-5xl leading-none tracking-tight text-savr-ink md:text-7xl">
          Savr
        </p>
        <h1 className="mt-6 max-w-xl text-2xl font-medium leading-snug text-savr-ink/90 md:text-3xl">
          Before you spend, check once.
        </h1>
        <p className="mt-4 max-w-lg text-base text-savr-ink/70">
          The consumer savings operating system for Nairobi — basket totals, ride quotes, and fuel
          prices in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/basket"
            className="bg-savr-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-savr-leaf"
          >
            Compare a basket
          </Link>
          <Link
            href="/rides"
            className="border border-savr-ink/20 bg-white/50 px-5 py-3 text-sm font-semibold text-savr-ink backdrop-blur transition hover:border-savr-forest"
          >
            Compare rides
          </Link>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        {[
          {
            title: "Basket compare",
            body: "Milk, bread, rice — whole list totals across Naivas, Quickmart, Carrefour.",
            href: "/basket",
          },
          {
            title: "Ride quotes",
            body: "Bolt, Uber, Little — who is cheapest to the airport right now.",
            href: "/rides",
          },
          {
            title: "Fuel nearby",
            body: "Station prices per litre with cashback so the smart stop is obvious.",
            href: "/fuel",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="group block space-y-2">
            <h2 className="font-display text-2xl text-savr-forest group-hover:text-savr-leaf">
              {item.title}
            </h2>
            <p className="text-sm leading-relaxed text-savr-ink/70">{item.body}</p>
          </Link>
        ))}
      </section>

      <section className="border-t border-savr-ink/10 pt-10">
        <p className="text-sm uppercase tracking-[0.2em] text-savr-clay">Phase 1 wedge</p>
        <p className="mt-3 max-w-2xl font-display text-3xl text-savr-ink">
          Win the weekly shop. Rides and fuel keep you opening Savr between shops.
        </p>
      </section>
    </div>
  );
}
