import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="hero-plane relative flex min-h-[100svh] w-full flex-col justify-end md:min-h-[min(100svh,880px)]">
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-28 md:px-6 md:pb-24">
          <p className="animate-rise font-display text-[clamp(4.5rem,18vw,9rem)] font-extrabold leading-[0.85] tracking-brand text-white">
            Savr
          </p>
          <h1 className="animate-rise-delay mt-6 max-w-lg font-display text-[1.65rem] font-semibold leading-[1.2] tracking-tightish text-white md:text-4xl">
            Before you spend, Savr it.
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-sm text-[15px] leading-relaxed text-white/75 md:text-base">
            Compare the real total. Keep the difference. Earn cashback for choosing smart.
          </p>
          <div className="animate-rise-delay-2 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/basket" className="btn-primary">
              Compare my basket
            </Link>
            <Link href="/check" className="btn-ghost">
              Could I have saved?
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-savr-forest">
          Everyday money decisions
        </p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tightish text-savr-ink md:text-[2.75rem] md:leading-[1.1]">
          Three checks that pay for themselves
        </h2>

        <div className="mt-12 divide-y divide-savr-ink/[0.08] border-y border-savr-ink/[0.08]">
          {[
            {
              title: "Basket",
              body: "Rank your full shopping list across Nairobi supermarkets — not one product at a time.",
              href: "/basket",
              meta: "Groceries",
            },
            {
              title: "Could have saved",
              body: "After a shop, see what you left on the table — and build the habit of checking first.",
              href: "/check",
              meta: "Receipt moment",
            },
            {
              title: "Prices",
              body: "Search one staple and see who is cheapest — with directions to the store.",
              href: "/prices",
              meta: "Single item",
            },
            {
              title: "Rides",
              body: "See Bolt, Uber, and Little side by side before you request.",
              href: "/rides",
              meta: "Transport",
            },
            {
              title: "Fuel",
              body: "Nearby litre prices so the smart fill-up is obvious.",
              href: "/fuel",
              meta: "Stations",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-2 py-7 transition md:flex-row md:items-end md:justify-between md:gap-8"
            >
              <div className="max-w-lg">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                  {item.meta}
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold tracking-tightish text-savr-ink transition group-hover:text-savr-forest md:text-3xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-savr-mute">{item.body}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-savr-forest transition group-hover:translate-x-1">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-savr-ink/[0.06] bg-savr-night px-4 py-14 text-white md:px-6 md:py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-2xl font-bold tracking-tightish md:text-3xl">
              Saved with Savr
            </p>
            <p className="mt-2 max-w-md text-[15px] text-white/65">
              Lifetime price savings and cashback from every smarter basket — not any purchase.
              Add Savr to your home screen for one-tap checks before you spend.
            </p>
          </div>
          <Link href="/wallet" className="btn-primary shrink-0">
            See my savings
          </Link>
        </div>
      </section>
    </div>
  );
}
