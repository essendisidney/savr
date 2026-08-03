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
  title: "Savr — Before you spend",
  description: "Nairobi’s spending OS. Compare baskets, rides, and fuel — then earn savings cashback.",
  applicationName: "Savr",
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
            <div className="alive-aurora" aria-hidden />
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
