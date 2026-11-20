import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSharedDeck } from "@/lib/share/share-store";
import type { DeckAST, OutputFormat } from "@/lib/schemas/deck-schema";
import type { Metadata } from "next";
import { CarouselCanvas } from "@/components/canvas/carousel-canvas";
import { PresentationCanvas } from "@/components/canvas/presentation-canvas";
import { InfographicCanvas } from "@/components/canvas/infographic-canvas";
import { SharePageActions } from "@/components/share/share-page-actions";
import { Sparkles, ArrowLeft, Layers, Monitor, ScrollText } from "lucide-react";

interface SharedPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ embed?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  let title = "StatDeck Presentation";
  let description = "Interactive visual presentation created with StatDeck.";

  try {
    const record = await getSharedDeck(token);
    const recordAst = record?.ast as DeckAST | undefined;
    if (recordAst?.meta?.title) {
      title = recordAst.meta.title;
      description = recordAst.meta.subtitle || recordAst.executiveSummary || description;
    }
  } catch {
    // Fallback
  }

  return {
    title: `${title} — StatDeck`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharedPresentationPage({
  params,
  searchParams,
}: SharedPageProps) {
  const { token } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "1" || embed === "true";

  if (!token) {
    notFound();
  }

  const record = await getSharedDeck(token);
  const ast = record?.ast as DeckAST | null;
  const format = (record?.format || ast?.format || "carousel") as OutputFormat;

  if (!ast) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 text-blue-400">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-2 tracking-tight">Presentation Not Found</h1>
        <p className="text-slate-400 max-w-md text-sm mb-6 leading-relaxed">
          This presentation link may have expired or the token is incorrect.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30"
        >
          <ArrowLeft className="w-4 h-4" />
          Create New Deck in StatDeck
        </Link>
      </div>
    );
  }

  const title = ast.meta?.title || "StatDeck Presentation";
  const remixUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/studio?remix=${encodeURIComponent(token)}`
    : `/studio?remix=${encodeURIComponent(token)}`;

  // EMBED MODE: Clean edge-to-edge frame for iframes
  if (isEmbed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 overflow-hidden relative">
        <div className="w-full flex items-center justify-center">
          {format === "carousel" && <CarouselCanvas ast={ast} scale={0.92} />}
          {format === "presentation" && <PresentationCanvas ast={ast} scale={0.92} />}
          {format === "infographic" && <InfographicCanvas ast={ast} scale={0.92} />}
        </div>
        <div className="absolute bottom-2 right-3 text-[10px] text-slate-500 font-sans flex items-center gap-1 bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-800">
          <span>Presented with</span>
          <a
            href={remixUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 font-bold hover:underline"
          >
            StatDeck
          </a>
        </div>
      </div>
    );
  }

  // STANDARD PUBLIC VIEWER PAGE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation & Action Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group text-slate-400 hover:text-white transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-600/30">
              SD
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white hidden sm:inline">
              StatDeck
            </span>
          </Link>
          <span className="text-slate-600 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-semibold text-slate-300 max-w-[200px] sm:max-w-xs truncate">
            {title}
          </span>
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1">
            {format === "carousel" && <Layers className="w-2.5 h-2.5 text-blue-400" />}
            {format === "presentation" && <Monitor className="w-2.5 h-2.5 text-orange-400" />}
            {format === "infographic" && <ScrollText className="w-2.5 h-2.5 text-emerald-400" />}
            {format}
          </span>
        </div>

        {/* Action Buttons: Embed Code + Remix */}
        <SharePageActions token={token} />
      </header>

      {/* Main Presentation Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-x-auto">
        <div className="w-full flex items-center justify-center py-6">
          {format === "carousel" && (
            <div className="scale-90 sm:scale-100 transition-transform origin-top">
              <CarouselCanvas ast={ast} scale={1} />
            </div>
          )}
          {format === "presentation" && (
            <div className="scale-90 sm:scale-100 transition-transform origin-top">
              <PresentationCanvas ast={ast} scale={1} />
            </div>
          )}
          {format === "infographic" && (
            <div className="scale-90 sm:scale-100 transition-transform origin-top">
              <InfographicCanvas ast={ast} scale={1} />
            </div>
          )}
        </div>
      </main>

      {/* Footer Branding & Sticky Action Bar */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 backdrop-blur-xs py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Generated with</span>
          <Link href="/" className="font-bold text-white hover:text-blue-400 transition-colors">
            StatDeck
          </Link>
          <span className="text-slate-600">•</span>
          <span>Zero AI hallucination deterministic visual synthesis</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link
            href={`/studio?remix=${encodeURIComponent(token)}`}
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Remix this deck
          </Link>
          <Link href="/pricing" className="hover:text-slate-200 transition-colors">
            Pricing
          </Link>
          <Link href="/studio" className="hover:text-slate-200 transition-colors">
            Create Free Deck
          </Link>
        </div>
      </footer>
    </div>
  );
}
