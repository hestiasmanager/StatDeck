"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatDeckMark } from "@/components/ui/statdeck-mark";
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  Presentation,
  FileSpreadsheet,
  Globe,
  Layers,
  ArrowRight,
  HelpCircle,
  Loader2,
} from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCheckout = async (tier: "creator" | "agency") => {
    setLoadingTier(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingCycle }),
      });
      const data = await res.json();

      if (res.status === 401) {
        // User needs to sign in first
        router.push(`/studio?auth=required&upgrade=${tier}`);
        return;
      }

      if (data.success) {
        alert(
          `Paddle ${tier.toUpperCase()} checkout session ready (Price ID: ${data.priceId}). In sandbox/test mode, you can toggle tiers instantly in /dashboard!`
        );
        router.push("/dashboard");
      } else {
        alert(data.error || "Failed to start checkout.");
      }
    } catch (e) {
      alert("Network error starting checkout.");
    } finally {
      setLoadingTier(null);
    }
  };

  const isAnnual = billingCycle === "annual";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <StatDeckMark className="w-6 h-6" barColor="#2563EB" />
          <span className="font-extrabold tracking-tight text-base text-slate-900 dark:text-slate-100">
            StatDeck
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/studio"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Studio
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Dashboard
          </Link>
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-102"
          >
            <span>Try Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Hero & Pricing Content */}
      <main className="max-w-6xl mx-auto w-full px-6 py-16 flex flex-col items-center gap-12">
        <div className="flex flex-col items-center text-center gap-4 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Transparent Pricing
          </span>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Predictable plans for creators, marketers, and agencies.
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Turn messy spreadsheets into high-converting LinkedIn carousels, infographics, and boardroom presentations. No credit card required to start.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300/80 dark:border-slate-700 mt-2">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "annual"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
          {/* 1. FREE PLAN */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Starter
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  Free
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Perfect for testing the studio and creating quick data graphics.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">$0</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>

              <ul className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>3 watermarked exports per week</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>1 Brand Kit preview</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>All 3 formats: Carousel, Deck, Poster</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>288+ theme and layout combinations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>High-DPI PNG and multi-page PDF</span>
                </li>
              </ul>
            </div>

            <Link
              href="/studio"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-colors"
            >
              Start Free (No Sign Up)
            </Link>
          </div>

          {/* 2. CREATOR PLAN (POPULAR) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-600 dark:border-blue-500 p-6 flex flex-col justify-between gap-6 shadow-xl relative scale-102">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
              Most Popular
            </span>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
                  For Creators & Marketers
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  Creator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Unlimited high-res exports and custom brand styling for thought leaders.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                  {isAnnual ? "$15" : "$19"}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
                {isAnnual && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                    (billed annually)
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <li className="flex items-start gap-2 font-semibold text-slate-900 dark:text-slate-100">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Unlimited watermark-free exports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>3 saved Brand Kits in your workspace</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>All formats: PNG, SVG, PDF, ZIP, HTML</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>1-Click Per-Slide AI Rewrite (Shorten, Detail, Executive)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Verified Source Provenance tooltips</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout("creator")}
              disabled={loadingTier === "creator"}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingTier === "creator" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Upgrade to Creator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* 3. AGENCY PLAN */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
                  For Agencies & Teams
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  Agency
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Native PowerPoint (.pptx), live Google Sheets sync, and client workspaces.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                  {isAnnual ? "$31" : "$39"}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
                {isAnnual && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                    (billed annually)
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <li className="flex items-start gap-2 font-bold text-purple-700 dark:text-purple-300">
                  <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>Native editable PowerPoint (.pptx) export</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Unlimited saved Brand Kits</span>
                </li>
                <li className="flex items-start gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Live Google Sheets / CSV 1-Click Refresh</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Custom footer branding & attribution removal</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Team workspace sharing & client handoff</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout("agency")}
              disabled={loadingTier === "agency"}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingTier === "agency" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Upgrade to Agency</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <section className="max-w-3xl w-full flex flex-col gap-6 pt-12 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center flex flex-col gap-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Everything you need to know about StatDeck plans and billing.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                q: "Are the PowerPoint (.pptx) slides truly editable?",
                a: "Yes! Unlike other tools that take raster screenshots, StatDeck's Agency tier compiles native Microsoft PowerPoint XML elements, editable vector shapes, real text boxes, and genuine PowerPoint chart series you can edit directly in Office or Keynote.",
              },
              {
                q: "How does the live Google Sheets sync work?",
                a: "Simply paste a public Google Sheets or CSV link. When your data changes, click 'Refresh Data' in your studio or dashboard. StatDeck recalculates all totals, rollups, and chart series in place without resetting your chosen theme or manual slide edits.",
              },
              {
                q: "Can I use the Studio without signing up?",
                a: "Absolutely. You can test sample presets, paste custom data, and preview the full 288+ theme matrix without ever creating an account. You're only prompted to sign in when saving to your cloud dashboard or exceeding free limits.",
              },
              {
                q: "Can I cancel or change my plan anytime?",
                a: "Yes. You can manage or cancel your subscription at any time with 1-click via the self-serve Paddle Customer Portal in your dashboard.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <span>© {new Date().getFullYear()} StatDeck. Built for modern creators, marketers, and consultants.</span>
      </footer>
    </div>
  );
}
