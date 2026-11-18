import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PSEO_WORKFLOWS, PSEO_SLUGS } from "@/lib/pseo/registry";
import { SAMPLE_PRESETS } from "@/lib/ai/presets";
import { StudioContainer } from "@/components/studio/studio-container";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PSEO_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = PSEO_WORKFLOWS[slug];
  if (!config) return {};

  return {
    title: config.title,
    description: config.metaDescription,
    openGraph: {
      title: config.title,
      description: config.metaDescription,
      type: "website",
    },
  };
}

export default async function ToolPseoPage({ params }: PageProps) {
  const { slug } = await params;
  const config = PSEO_WORKFLOWS[slug];

  if (!config) {
    notFound();
  }

  const basePreset = SAMPLE_PRESETS[config.samplePresetKey];
  const preloadedAst = {
    ...basePreset,
    format: config.targetFormat,
    templateId: config.defaultTemplateId,
  };

  // Structured Data Schema.org SoftwareApplication
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `StatDeck ${config.h1}`,
    operatingSystem: "All",
    applicationCategory: "DesignApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: config.metaDescription,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SEO Hero Strip */}
      <section className="bg-gradient-to-b from-blue-50/50 via-white to-transparent dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>StatDeck Free Tool Suite</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            {config.h1}
          </h1>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {config.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            {config.features.map((feat, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {feat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Embedded Live Interactive Studio */}
      <div className="flex-1">
        <StudioContainer initialAst={preloadedAst} />
      </div>

      {/* Cross-linking other workflow tools */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            More High-Intent Visualizers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(PSEO_WORKFLOWS).map((item) => (
              <Link
                key={item.slug}
                href={`/tools/${item.slug}`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 transition-colors"
              >
                <span>{item.h1.slice(0, 38)}...</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
