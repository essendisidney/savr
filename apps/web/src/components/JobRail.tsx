"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const RAILS = {
  buy: [
    { href: "/prices", label: "Item", prefix: "/prices" },
    { href: "/basket?staples=1", label: "Basket", prefix: "/basket" },
    { href: "/market", label: "Online", prefix: "/market" },
    { href: "/bundles", label: "Data", prefix: "/bundles" },
    { href: "/check", label: "After shop", prefix: "/check" },
  ],
  city: [
    { href: "/map", label: "Map", prefix: "/map" },
    { href: "/fuel", label: "Fuel", prefix: "/fuel" },
    { href: "/rides", label: "Rides", prefix: "/rides" },
  ],
} as const;

export type JobRailKind = keyof typeof RAILS;

export function JobRail({ kind }: { kind: JobRailKind }) {
  const pathname = usePathname();
  return (
    <nav
      className="job-rail mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={kind === "buy" ? "Compare" : "Nearby"}
    >
      {RAILS[kind].map((item) => {
        const active = pathname === item.prefix || pathname.startsWith(item.prefix);
        return (
          <Link
            key={item.prefix}
            href={item.href}
            className={active ? "chip-active shrink-0" : "chip shrink-0"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
