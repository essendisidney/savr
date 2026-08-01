import Link from "next/link";

const themes = {
  basket: {
    label: "Groceries · Nairobi",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1800&q=80",
  },
  rides: {
    label: "Transport",
    image:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1800&q=80",
  },
  fuel: {
    label: "Fuel · Nearby",
    image:
      "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&w=1800&q=80",
  },
  wallet: {
    label: "Savr Wallet",
    image:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1800&q=80",
  },
  login: {
    label: "Account",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80",
  },
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
    <section
      className="relative overflow-hidden border-b border-savr-ink/5"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(1,20,14,0.72) 0%, rgba(1,20,14,0.55) 45%, rgba(243,250,246,0.97) 100%), url(${t.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full bg-savr-signal/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-savr-leaf/30 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-10 md:px-6 md:pb-12 md:pt-14">
        <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.22em] text-savr-signal">
          {t.label}
        </p>
        <h1 className="animate-rise-delay mt-3 max-w-2xl font-display text-[clamp(2rem,6vw,3.4rem)] font-extrabold leading-[1.05] tracking-tightish text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="animate-rise-delay-2 mt-3 max-w-lg text-[15px] leading-relaxed text-white/75 md:text-base">
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
