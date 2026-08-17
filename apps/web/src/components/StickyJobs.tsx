"use client";

import { usePathname } from "next/navigation";
import { JobRail } from "@/components/JobRail";

const BUY = ["/ask", "/prices", "/basket", "/market", "/bundles", "/check"];
const CITY = ["/map", "/fuel", "/rides"];

function matches(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export function StickyJobs() {
  const path = usePathname();
  const buy = matches(path, BUY);
  const city = matches(path, CITY);
  if (!buy && !city) return null;

  return (
    <div className="sticky-jobs sticky top-14 z-30 border-b border-savr-ink/[0.07] bg-white/95 backdrop-blur-xl md:top-16">
      <div className="mx-auto max-w-5xl px-4 py-2 md:px-6">
        <JobRail kind={buy ? "buy" : "city"} className="mt-0" />
      </div>
    </div>
  );
}
