import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Barlow_Condensed, Outfit } from "next/font/google";

import "@/app/globals.css";
import clubConfig from "@/config/club.json";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-barlow-cn",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: clubConfig.name,
    template: `%s · ${clubConfig.name}`,
  },
  description: `Schedule, RSVPs, and payments for ${clubConfig.name}.`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${outfit.variable} ${barlowCondensed.variable}`} lang="en">
      <body>{children}</body>
    </html>
  );
}
