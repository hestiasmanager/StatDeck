import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StatDeck — URL & Data to Infographics, LinkedIn Carousels & PowerPoint",
  description:
    "Turn any URL, CSV, Excel, or PDF into brand-locked infographics, swipeable LinkedIn carousels, and native PowerPoint decks. Zero AI image generation, zero server-side headless browsers.",
  openGraph: {
    title: "StatDeck — Data to Infographics, Carousels & PowerPoint Decks",
    description:
      "Deterministic, brand-grade visual data decks engineered for near-zero AI operating costs.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
