import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Savr — Before you spend",
  description: "Nairobi’s spending OS. Compare baskets, rides, and fuel — then earn savings cashback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE">
      <body className={`${display.variable} ${sans.variable} min-h-screen font-sans text-savr-ink antialiased`}>
        <Providers>
          <div className="grain-bg min-h-screen">
            <AppNav />
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
