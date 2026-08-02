import Link from "next/link";

const themes = {
  basket: { label: "Groceries · Nairobi" },
  rides: { label: "Transport" },
  fuel: { label: "Fuel · Nearby" },
  wallet: { label: "Saved with Savr" },
  prices: { label: "Price check · Nairobi" },
  login: { label: "Account" },
  account: { label: "Your profile" },
  check: { label: "After the shop" },
} as const;

export type PageTheme = keyof typeof themes;

export function PageHero({
  theme,
  title,
  subtitle,
  action,
}: {
  theme: PageTheme;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  const t = themes[theme];

  return (
    <section className="border-b border-savr-ink/[0.05]">
      <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-10 md:px-6 md:pb-10 md:pt-14">
        <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
          {t.label}
        </p>
        <h1 className="animate-rise-delay mt-2 max-w-2xl font-display text-[clamp(1.85rem,4.5vw,2.75rem)] font-extrabold leading-[1.1] tracking-tightish text-savr-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="animate-rise-delay-2 mt-3 max-w-lg text-[15px] leading-relaxed text-savr-mute md:text-base">
            {subtitle}
          </p>
        )}
        {action && (
          <Link href={action.href} className="btn-primary mt-6 inline-flex animate-rise-delay-2">
            {action.label}
          </Link>
        )}
      </div>
    </section>
  );
}
