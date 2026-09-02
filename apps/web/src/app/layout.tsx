import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppNav } from "@/components/AppNav";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PwaRegister } from "@/components/PwaRegister";
import { Providers } from "@/components/Providers";
import { ScrollUnlock } from "@/components/ScrollUnlock";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://savr-teal.vercel.app"),
  title: {
    default: "Savr — Sell. Buy. Trust.",
    template: "%s · Savr",
  },
  description:
    "Kenya’s trusted second-hand marketplace. Post in 60 seconds. Money held until you confirm.",
  applicationName: "Savr",
  openGraph: {
    title: "Savr — Sell. Buy. Trust.",
    description:
      "Second-hand deals with escrow. Sell fast. Buy with confidence. Kenya.",
    url: "https://savr-teal.vercel.app",
    siteName: "Savr",
    locale: "en_KE",
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Savr" }],
  },
  twitter: {
    card: "summary",
    title: "Savr — Sell. Buy. Trust.",
    description: "Kenya second-hand deals with escrow — money held until you confirm.",
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Savr",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#00C853",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE">
      <body
        className={`${display.variable} ${sans.variable} min-h-screen font-sans text-savr-ink antialiased`}
      >
        <Providers>
          <div className="grain-bg relative min-h-screen">
            <AppNav />
            <main>{children}</main>
            <SiteFooter />
            <BottomNav />
            <InstallPrompt />
            <ScrollUnlock />
            <PwaRegister />
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
