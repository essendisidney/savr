import type { Metadata } from "next";

const SITE = "https://savr-teal.vercel.app";

export const metadata: Metadata = {
  title: "Join Savr — Before you spend",
  description:
    "Nairobi’s spending check. Compare grocery baskets across branches, tip shelf prices, keep more KES.",
  openGraph: {
    title: "Savr — Before you spend",
    description:
      "Nairobi is open. Compare baskets across Naivas, Quickmart, Carrefour & peers — then tip what you see.",
    url: `${SITE}/invite`,
    siteName: "Savr",
    locale: "en_KE",
    type: "website",
    images: [{ url: `${SITE}/icons/icon-512.png`, width: 512, height: 512, alt: "Savr" }],
  },
  twitter: {
    card: "summary",
    title: "Savr — Before you spend",
    description: "Nairobi’s spending OS. Compare before you shop.",
    images: [`${SITE}/icons/icon-512.png`],
  },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
