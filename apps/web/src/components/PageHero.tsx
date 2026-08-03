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
    <section className="page-hero relative overflow-hidden border-b border-white/40">
      <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 pb-9 pt-11 md:px-6 md:pb-11 md:pt-14">
        <p className="page-eyebrow animate-rise">{t.label}</p>
        <h1 className="page-title animate-rise-delay mt-2.5 max-w-2xl text-[clamp(1.9rem,4.6vw,2.85rem)]">
          {title}
        </h1>
        {subtitle && (
          <p className="animate-rise-delay-2 mt-3.5 max-w-lg text-[15px] leading-relaxed text-savr-mute md:text-base">
            {subtitle}
          </p>
        )}
        {action && (
          <Link href={action.href} className="btn-primary mt-7 inline-flex animate-rise-delay-2">
            {action.label}
          </Link>
        )}
      </div>
    </section>
  );
}
