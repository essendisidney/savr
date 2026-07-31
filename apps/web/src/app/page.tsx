import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="hero-plane relative min-h-[min(92vh,820px)] w-full">
        <div className="mx-auto flex min-h-[min(92vh,820px)] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 md:px-6 md:pb-20">
          <p className="animate-rise font-display text-6xl font-extrabold leading-[0.9] tracking-tight text-white md:text-8xl lg:text-9xl">
            Savr
          </p>
          <h1 className="animate-rise-delay mt-5 max-w-xl font-display text-2xl font-semibold leading-snug text-white md:text-4xl">
            Before you spend, Savr it.
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-md text-base text-white/80 md:text-lg">
            Nairobi’s spending OS — find the lowest total, earn cashback, move on.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/basket" className="btn-primary animate-pulseSoft">
              Compare my basket
            </Link>
            <Link href="/rides" className="btn-ghost">
              Check a ride
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-savr-forest">
          One open. Three wins.
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-savr-ink md:text-5xl">
          Stop juggling apps. Start keeping the money.
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            {
              n: "01",
              title: "Basket",
              body: "Whole shopping lists ranked across Naivas, Quickmart, Carrefour.",
              href: "/basket",
              cta: "Save on groceries",
            },
            {
              n: "02",
              title: "Rides",
              body: "Bolt, Uber, Little — pick the cheapest fare before you book.",
              href: "/rides",
              cta: "Compare fares",
            },
            {
              n: "03",
              title: "Fuel",
              body: "Nearby litre prices so the smart fill-up is obvious.",
              href: "/fuel",
              cta: "Find cheap fuel",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group block border-t border-savr-ink/10 pt-5">
              <p className="font-display text-sm font-bold text-savr-forest">{item.n}</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-savr-ink transition group-hover:text-savr-forest md:text-3xl">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-savr-ink/65">{item.body}</p>
              <p className="mt-5 text-sm font-semibold text-savr-forest underline-offset-4 group-hover:underline">
                {item.cta} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="save-strip animate-shimmer px-4 py-14 text-savr-ink md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Smart choice. Real cashback.
            </p>
            <p className="mt-2 max-w-xl text-sm text-savr-ink/80 md:text-base">
              Savr rewards the cheaper path — not just any purchase.
            </p>
          </div>
          <Link
            href="/wallet"
            className="bg-savr-night px-5 py-3 text-sm font-bold text-white transition hover:bg-savr-ink"
          >
            Open wallet
          </Link>
        </div>
      </section>
    </div>
  );
}
