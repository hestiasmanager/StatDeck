"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatDeckMark } from "@/components/ui/statdeck-mark";
import {
  Sparkles,
  ArrowRight,
  Layers,
  ScrollText,
  Monitor,
  FileSpreadsheet,
  Globe,
  Presentation,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Users,
  Briefcase,
  Zap,
} from "lucide-react";

const SAMPLE_PRESETS_QUICK = [
  {
    id: "saas-churn-metrics",
    label: "SaaS Churn & ARR Analysis",
    preview: "Q3 SaaS churn dropped to 1.8%, while ARR expanded to $42.8M with 184% net retention velocity.",
  },
  {
    id: "series-a-fundraising-pitch",
    label: "Series A Growth Deck",
    preview: "Gross margin grew to 82% with 4.5x LTV/CAC ratio across 45 enterprise pipeline accounts.",
  },
  {
    id: "fintech-market-pulse",
    label: "Fintech Volume Pulse",
    preview: "Payment gateway transaction volume climbed +128% YoY reaching $2.4B total processed volume.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [inputText, setInputText] = useState(
    "Q3 Performance Summary:\n- Annual Recurring Revenue: $42.8M (+38% YoY)\n- Net Dollar Retention: 124%\n- Gross Churn: 1.8% (Down from 3.2%)\n- Enterprise Pipeline: 85 Accounts ($14.2M expected ARR)"
  );
  const [activeUseCase, setActiveUseCase] = useState<"creators" | "marketers" | "agencies">("creators");

  const handleLaunchStudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      router.push("/studio");
      return;
    }
    router.push(`/studio?content=${encodeURIComponent(inputText.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* 1. Header Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <StatDeckMark className="w-6 h-6" barColor="#2563EB" />
            <span className="font-extrabold tracking-tight text-base text-slate-900 dark:text-slate-100">
              StatDeck
            </span>
          </Link>
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            2.0 SaaS
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Features
          </a>
          <a href="#use-cases" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Use Cases
          </a>
          <Link href="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-102"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-blue-50/40 via-white to-transparent dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transform Raw Data into High-Converting Presentations</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-[1.08] max-w-4xl">
            Turn messy spreadsheets into <span className="text-blue-600 dark:text-blue-400">boardroom-ready</span> slides & viral carousels.
          </h1>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Stop fighting PowerPoint alignment and clunky design software. StatDeck ingests your raw CSVs, Google Sheets, or bullet notes and synthesizes magazine-grade slides, 4:5 LinkedIn carousels, and native editable <code>.pptx</code> in seconds.
          </p>

          {/* Interactive Hero Quick Launcher */}
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5 text-left mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Try (No Sign-Up Required)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">Paste & Go</span>
            </div>

            {/* Preset Selector Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {SAMPLE_PRESETS_QUICK.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => router.push(`/studio?preset=${preset.id}`)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleLaunchStudio} className="flex flex-col gap-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                placeholder="Paste raw notes, metrics, or table data here..."
                className="w-full p-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 hidden sm:flex">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Zero sign-up preview</span>
                </div>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all hover:scale-102 cursor-pointer"
                >
                  <span>Synthesize in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>4:5 LinkedIn Carousel PDF</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Monitor className="w-3.5 h-3.5 text-orange-500" />
              <span>16:9 Editable PowerPoint (.pptx)</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <ScrollText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Poster Infographics</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. Before & After Showcase */}
      <section className="py-20 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              From Raw Data Dump to Editorial Precision
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Never copy-paste screenshots of spreadsheets again. StatDeck formats real numbers with magazine-grade typography.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* BEFORE: Messy CSV */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full w-fit">
                  Before: Raw CSV / Notes
                </span>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed text-slate-500 overflow-x-auto">
                  <p>Quarter,Segment,ARR,Growth,Churn</p>
                  <p>Q1,Enterprise,14200000,32%,3.1%</p>
                  <p>Q2,Enterprise,22800000,48%,2.4%</p>
                  <p>Q3,Enterprise,42800000,184%,1.8%</p>
                  <p className="mt-2 text-slate-400 italic">
                    // &quot;Please make this look nice for the board meeting by 3pm&quot;
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                ❌ Hours wasted dragging boxes in Canva or PowerPoint
              </span>
            </div>

            {/* AFTER: StatDeck Branded Slide */}
            <div className="p-6 rounded-3xl border-2 border-blue-500/80 bg-blue-50/20 dark:bg-blue-950/20 flex flex-col justify-between gap-4 shadow-xl">
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full w-fit flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>After: StatDeck Synthesized Slide</span>
                </span>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      SaaS Growth Velocity
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      +184% YoY
                    </span>
                  </div>

                  <h4 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    Enterprise ARR Expansion
                  </h4>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="text-base font-black text-blue-600 font-mono">$42.8M</span>
                      <span className="text-[10px] text-slate-500 block">Q3 ARR</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="text-base font-black text-emerald-600 font-mono">1.8%</span>
                      <span className="text-[10px] text-slate-500 block">Gross Churn</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="text-base font-black text-purple-600 font-mono">184%</span>
                      <span className="text-[10px] text-slate-500 block">Net Retention</span>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                ✅ Done in 4 seconds. Export to LinkedIn PDF or native editable .pptx.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Audience Use-Case Tabs */}
      <section id="use-cases" className="py-20 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Built for High-Stakes Storytellers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose your workflow to see how StatDeck accelerates presentation creation.
            </p>
          </div>

          {/* Use Case Tabs */}
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl w-fit mx-auto">
            <button
              onClick={() => setActiveUseCase("creators")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeUseCase === "creators"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>LinkedIn Creators</span>
            </button>

            <button
              onClick={() => setActiveUseCase("marketers")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeUseCase === "marketers"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>B2B Growth & Marketing</span>
            </button>

            <button
              onClick={() => setActiveUseCase("agencies")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeUseCase === "agencies"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Consultants & Agencies</span>
            </button>
          </div>

          {/* Use Case Content Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div className="flex flex-col gap-4 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                {activeUseCase === "creators"
                  ? "4:5 Carousel Mastery"
                  : activeUseCase === "marketers"
                  ? "Data Storytelling & One-Pagers"
                  : "Native PowerPoint & Brand Kits"}
              </span>

              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {activeUseCase === "creators"
                  ? "High-DPI multi-page PDF carousels that drive reposts."
                  : activeUseCase === "marketers"
                  ? "Turn quarterly case study metrics into sharable asset packs."
                  : "Deliver 100% editable .pptx decks styled to any client's brand."}
              </h3>

              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {activeUseCase === "creators"
                  ? "Swipeable carousels get 5x more impressions on LinkedIn than text posts. StatDeck balances typography, cover takeaways, and charts into a perfectly sized 1080×1350 package."
                  : activeUseCase === "marketers"
                  ? "Generate infographic posters, stat callout blocks, and comparison tables for sales enablement, pitch collateral, and social media demand gen."
                  : "Extract brand colors, logos, and fonts from any client domain in 3 seconds. Connect their live Google Sheets and export genuine Microsoft Office PowerPoint files."}
              </p>

              <Link
                href="/studio"
                className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline w-fit mt-2"
              >
                <span>Launch Studio with this workflow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="w-full md:w-80 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                Included Features
              </span>
              <ul className="flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>1-Click Per-Slide AI Rewrite</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified Source Provenance tooltips</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Live Google Sheets / CSV 1-Click Refresh</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive Chart Data Grid Drawer</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="features" className="py-20 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              The Architecture of High-Trust Presentations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Engineered for accuracy, brand compliance, and zero design fatigue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Live Google Sheets Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect your spreadsheet. When quarterly numbers change, click <strong>Refresh</strong> and all slides update in place without resetting your edits or themes.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Presentation className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Native Editable PowerPoint
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No raster screenshots. Exports genuine PowerPoint shapes, text boxes, and native Microsoft Office chart series you can edit in PowerPoint or Keynote.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Click-to-Verify Provenance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Every KPI and chart bar tracks its exact source quote, PDF page, or CSV row number. Hover or click to audit numbers before presenting to clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom CTA Strip */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Ready to turn your raw numbers into presentations that convert?
          </h2>
          <p className="text-sm md:text-base opacity-90 max-w-xl">
            Join thousands of founders, marketers, and consultants using StatDeck to build high-impact presentations in seconds.
          </p>
          <Link
            href="/studio"
            className="flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 font-extrabold text-sm rounded-2xl shadow-xl hover:bg-blue-50 transition-all hover:scale-105"
          >
            <span>Launch StatDeck Studio Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <StatDeckMark className="w-5 h-5" barColor="#2563EB" />
            <span className="font-extrabold text-slate-900 dark:text-slate-100">StatDeck</span>
            <span>— The Data Presentation Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/studio" className="hover:text-blue-600">
              Studio
            </Link>
            <Link href="/pricing" className="hover:text-blue-600">
              Pricing
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/tools/csv-to-carousel" className="hover:text-blue-600">
              CSV to Carousel
            </Link>
            <Link href="/tools/survey-to-slides" className="hover:text-blue-600">
              Survey to Slides
            </Link>
          </div>

          <span>© {new Date().getFullYear()} StatDeck. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
