import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Savr — Before you spend",
  description: "The Consumer Savings Operating System. Compare baskets, rides, and fuel in Nairobi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE">
      <body className={`${display.variable} ${sans.variable} min-h-screen font-sans text-savr-ink antialiased`}>
        <div className="grain-bg min-h-screen">
          <AppNav />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
