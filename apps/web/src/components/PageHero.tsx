import Link from "next/link";

const themes = {
  basket: { label: "Groceries · Nairobi" },
  rides: { label: "Transport" },
  fuel: { label: "Fuel · Nearby" },
  wallet: { label: "Wallet" },
  prices: { label: "Compare · Nairobi" },
  login: { label: "Account" },
  account: { label: "You" },
  check: { label: "After the shop" },
  market: { label: "Compare · Online" },
  bundles: { label: "Airtime · Kenya" },
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
    <section className="page-hero relative overflow-hidden border-b border-white/50">
      <div className="relative mx-auto max-w-5xl px-4 pb-6 pt-7 md:px-6 md:pb-8 md:pt-9">
        <p className="page-eyebrow">{t.label}</p>
        <h1 className="page-title mt-1.5 max-w-2xl text-[clamp(1.45rem,3.8vw,2.15rem)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-savr-mute md:text-[15px]">
            {subtitle}
          </p>
        )}
        {action && (
          <Link href={action.href} className="btn-primary mt-5 inline-flex">
            {action.label}
          </Link>
        )}
      </div>
    </section>
  );
}
