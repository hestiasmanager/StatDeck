import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Instrument_Serif, Fraunces, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://stat-deck.vercel.app"),
  title: "StatDeck — URL & Data to Infographics, LinkedIn Carousels & PowerPoint",
  description:
    "Turn any URL, CSV, Excel, or PDF into brand-locked infographics, swipeable LinkedIn carousels, and native PowerPoint decks. Zero AI image generation, zero server-side headless browsers.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "StatDeck — Data to Infographics, Carousels & PowerPoint Decks",
    description:
      "Deterministic, brand-grade visual data decks engineered for near-zero AI operating costs.",
    type: "website",
    images: [
      {
        url: "/statdeck-logo.png",
        width: 1024,
        height: 1024,
        alt: "StatDeck Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StatDeck — URL & Data to Visual Decks",
    description:
      "Turn any URL, CSV, Excel, or PDF into brand-locked infographics, swipeable LinkedIn carousels, and native PowerPoint decks.",
    images: ["/statdeck-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${instrumentSerif.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("statdeck-app-theme")||"system";var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=s==="system"?(m?"dark":"light"):s;var d=document.documentElement;if(r==="dark"||r==="cyber"){d.classList.add("dark")}else{d.classList.remove("dark")}d.setAttribute("data-theme",r)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
