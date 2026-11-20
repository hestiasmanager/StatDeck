import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { redis } from "@/lib/cache/redis";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { DeckAST, OutputFormat } from "@/lib/schemas/deck-schema";
import type { SharedDeckRecord } from "@/app/api/share/route";
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
    const record = await redis.get<SharedDeckRecord>(`statdeck:share:${token}`);
    const recordAst = record?.ast as DeckAST | undefined;
    if (recordAst?.meta?.title) {
      title = recordAst.meta.title;
      description = recordAst.meta.subtitle || recordAst.executiveSummary || description;
    } else {
      const [proj] = await db
        .select()
        .from(projects)
        .where(eq(projects.shareToken, token))
        .limit(1);
      if (proj?.title) {
        title = proj.title;
        description = (proj.ast as DeckAST)?.meta?.subtitle || description;
      }
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

  // 1. Try Redis cache
  let ast: DeckAST | null = null;
  let format: OutputFormat = "carousel";

  try {
    const record = await redis.get<SharedDeckRecord>(`statdeck:share:${token}`);
    if (record?.ast) {
      ast = record.ast as DeckAST;
      format = (record.format || ast.format || "carousel") as OutputFormat;
    }
  } catch {
    // Redis offline or key missing
  }

  // 2. Fallback to Supabase PostgreSQL projects table
  if (!ast) {
    try {
      const [proj] = await db
        .select()
        .from(projects)
        .where(eq(projects.shareToken, token))
        .limit(1);

      if (proj && proj.ast) {
        ast = proj.ast as DeckAST;
        format = (proj.format || ast.format || "carousel") as OutputFormat;
      }
    } catch {
      // Database query error
    }
  }

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
            href={`https://statdeck.ai/studio?remix=${encodeURIComponent(token)}`}
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-black text-sm tracking-tight text-white hidden sm:inline">
              Stat<span className="text-blue-500">Deck</span>
            </span>
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[160px] sm:max-w-md">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
            {format === "carousel" && <Layers className="w-3.5 h-3.5 text-blue-400" />}
            {format === "presentation" && <Monitor className="w-3.5 h-3.5 text-purple-400" />}
            {format === "infographic" && <ScrollText className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="capitalize">{format}</span>
          </div>

          <SharePageActions token={token} />
        </div>
      </header>

      {/* Main Presentation Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full flex items-center justify-center max-w-6xl">
          {format === "carousel" && <CarouselCanvas ast={ast} scale={1} />}
          {format === "presentation" && <PresentationCanvas ast={ast} scale={1} />}
          {format === "infographic" && <InfographicCanvas ast={ast} scale={1} />}
        </div>
      </main>

      {/* Footer Branding & Sticky Remix CTA */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950/90 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between px-6 gap-3">
        <div>
          Powered by{" "}
          <Link href="/" className="font-bold text-slate-400 hover:text-white transition-colors">
            StatDeck Studio
          </Link>{" "}
          · Commercial Data Presentation Engine
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/studio?remix=${encodeURIComponent(token)}`}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Remix this presentation with your data</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
