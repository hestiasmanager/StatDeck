"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StatDeckMark } from "@/components/ui/statdeck-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BrandKitModal } from "@/components/studio/brand-kit-modal";
import {
  Layers,
  ScrollText,
  Monitor,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  CreditCard,
  LogOut,
  Clock,
  Globe,
  RefreshCw,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sliders,
  ChevronRight,
  User,
} from "lucide-react";
import type { SubscriptionTier } from "@/lib/paddle/types";

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string | null;
  weeklyExportCount: number;
  workspaceId: string;
}

interface ProjectItem {
  id: string;
  title: string;
  format: "infographic" | "carousel" | "presentation";
  templateId: string;
  brandKitId: string | null;
  dataSourceUrl: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
}

interface BrandKitItem {
  id: string;
  name: string;
  domain?: string | null;
  logoUrl?: string | null;
  colors: {
    primary: string;
    secondary?: string;
    accent: string;
    background?: string;
    surface?: string;
    text?: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<"decks" | "brand-kits">("decks");

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKitItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [isBrandKitModalOpen, setIsBrandKitModalOpen] = useState(false);
  const [devMessage, setDevMessage] = useState("");

  const loadUserData = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        router.push("/studio?auth=required");
      }
    } catch (e) {
      console.error("Failed to load user:", e);
    } finally {
      setIsLoadingUser(false);
    }
  }, [router]);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (e) {
      console.error("Failed to load projects:", e);
    }
  }, []);

  const loadBrandKits = useCallback(async () => {
    try {
      const res = await fetch("/api/brand-kits");
      const data = await res.json();
      if (data.brandKits) {
        setBrandKits(data.brandKits);
      }
    } catch (e) {
      console.error("Failed to load brand kits:", e);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (user) {
      setIsLoadingData(true);
      Promise.all([loadProjects(), loadBrandKits()]).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [user, loadProjects, loadBrandKits]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/studio");
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deck?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert("Failed to delete project");
    }
  };

  const handleDuplicateProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "POST" });
      const data = await res.json();
      if (data.project) {
        setProjects((prev) => [data.project, ...prev]);
      }
    } catch (e) {
      alert("Failed to duplicate project");
    }
  };

  const handleDeleteBrandKit = async (id: string) => {
    if (!confirm("Delete this brand kit?")) return;
    try {
      await fetch(`/api/brand-kits/${id}`, { method: "DELETE" });
      setBrandKits((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      alert("Failed to delete brand kit");
    }
  };

  const handleDevSwitchTier = async (newTier: "free" | "creator" | "agency") => {
    try {
      const res = await fetch("/api/auth/dev-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      const data = await res.json();
      if (data.success && user) {
        setUser({ ...user, subscriptionTier: newTier });
        setDevMessage(`Switched tier to ${newTier.toUpperCase()}`);
        setTimeout(() => setDevMessage(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshProjectData = async (project: ProjectItem) => {
    if (!project.dataSourceUrl) return;
    setRefreshingId(project.id);
    try {
      const res = await fetch(`/api/live-sync?url=${encodeURIComponent(project.dataSourceUrl)}`);
      const data = await res.json();
      if (data.success) {
        alert("Google Sheet data refreshed successfully! Reopen deck in Studio to see live numbers.");
        loadProjects();
      } else {
        alert(data.error || "Failed to refresh Google Sheet data.");
      }
    } catch (e) {
      alert("Network error refreshing data.");
    } finally {
      setRefreshingId(null);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const tier = user?.subscriptionTier || "free";
  const tierColor =
    tier === "agency"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800"
      : tier === "creator"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800"
      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 1. Header Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <StatDeckMark className="w-6 h-6" barColor="#2563EB" />
            <span className="font-extrabold tracking-tight text-base text-slate-900 dark:text-slate-100">
              StatDeck
            </span>
          </Link>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>New Deck</span>
          </Link>

          <Link
            href="/pricing"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1"
          >
            Pricing
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:border-slate-800 mx-1" />

          {/* User Profile dropdown button */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 overflow-hidden border border-slate-300 dark:border-slate-700">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.email} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline max-w-[150px] truncate">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Workspace Overview Banner */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {user?.fullName || user?.email.split("@")[0]}&apos;s Decks
              </h1>
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tierColor}`}
              >
                {tier} Plan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage saved presentations, LinkedIn carousels, infographics, and brand kits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Weekly Exports Tracker */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
              <Clock className="w-4 h-4 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Weekly Exports
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {tier === "free" ? `${user?.weeklyExportCount || 0} / 3 Used` : "Unlimited"}
                </span>
              </div>
            </div>

            {/* Upgrade CTA or Manage Billing */}
            {tier === "free" ? (
              <Link
                href="/pricing"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to Creator</span>
              </Link>
            ) : (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/billing/portal");
                    const data = await res.json();
                    if (data.portalUrl) {
                      window.location.href = data.portalUrl;
                    } else {
                      alert("Billing portal active on your subscription.");
                    }
                  } catch (e) {
                    alert("Could not load billing portal");
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Manage Subscription</span>
              </button>
            )}

            {/* Development Tier Switcher (Convenient Local Testing) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 hidden lg:inline">
                Test Tier:
              </span>
              {(["free", "creator", "agency"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleDevSwitchTier(t)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    tier === t
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {devMessage && (
          <div className="max-w-6xl mx-auto mt-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{devMessage}</span>
          </div>
        )}
      </section>

      {/* 3. Main Dashboard Content with Tabs */}
      <main className="max-w-6xl mx-auto w-full p-6 flex-1 flex flex-col gap-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("decks")}
            className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === "decks"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Saved Decks ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("brand-kits")}
            className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === "brand-kits"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Brand Kits ({brandKits.length})</span>
          </button>
        </div>

        {/* TAB 1: SAVED DECKS */}
        {activeTab === "decks" && (
          <div className="flex flex-col gap-4">
            {isLoadingData ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">Loading your saved decks...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-16 px-6 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No decks saved yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                  Generate your first LinkedIn carousel, data-dense infographic, or presentation deck from any raw text, CSV, or URL.
                </p>
                <Link
                  href="/studio"
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-102"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Deck</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => {
                  const formatIcon =
                    proj.format === "infographic" ? (
                      <ScrollText className="w-3.5 h-3.5" />
                    ) : proj.format === "presentation" ? (
                      <Monitor className="w-3.5 h-3.5" />
                    ) : (
                      <Layers className="w-3.5 h-3.5" />
                    );

                  const formatLabel =
                    proj.format === "infographic"
                      ? "Poster"
                      : proj.format === "presentation"
                      ? "Deck 16:9"
                      : "Carousel 4:5";

                  return (
                    <div
                      key={proj.id}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4 hover:shadow-lg hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                            {formatIcon}
                            {formatLabel}
                          </span>

                          {proj.dataSourceUrl && (
                            <span
                              className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50"
                              title={`Synced with ${proj.dataSourceUrl}`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Live Sheets</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {proj.title}
                        </h3>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Edited {new Date(proj.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Card Action Strip */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <Link
                          href={`/studio?id=${proj.id}`}
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Open Studio</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        <div className="flex items-center gap-1">
                          {proj.dataSourceUrl && (
                            <button
                              onClick={() => handleRefreshProjectData(proj)}
                              disabled={refreshingId === proj.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Refresh live Google Sheets / CSV data"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${refreshingId === proj.id ? "animate-spin text-emerald-500" : ""}`}
                              />
                            </button>
                          )}

                          <button
                            onClick={() => handleDuplicateProject(proj.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Duplicate Deck"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Deck"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BRAND KITS */}
        {activeTab === "brand-kits" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Saved Brand Kits
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extract logos, color palettes, and typography from company domains to instantly brand every slide.
                </p>
              </div>

              <button
                onClick={() => setIsBrandKitModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Brand Kit</span>
              </button>
            </div>

            {brandKits.length === 0 ? (
              <div className="py-16 px-6 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3">
                <Globe className="w-8 h-8 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No brand kits saved
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Extract your logo and brand colors from your website domain in 3 seconds.
                </p>
                <button
                  onClick={() => setIsBrandKitModalOpen(true)}
                  className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Extract Brand Kit</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brandKits.map((kit) => (
                  <div
                    key={kit.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {kit.logoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={kit.logoUrl}
                              alt={kit.name}
                              className="w-6 h-6 object-contain rounded"
                            />
                          )}
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {kit.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleDeleteBrandKit(kit.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {kit.domain && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {kit.domain}
                        </span>
                      )}

                      {/* Color Palette preview */}
                      <div className="flex items-center gap-2 pt-2">
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-xs"
                          style={{ backgroundColor: kit.colors.primary }}
                          title={`Primary: ${kit.colors.primary}`}
                        />
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-xs"
                          style={{ backgroundColor: kit.colors.accent }}
                          title={`Accent: ${kit.colors.accent}`}
                        />
                        {kit.colors.secondary && (
                          <div
                            className="w-6 h-6 rounded-lg border border-black/10 shadow-xs"
                            style={{ backgroundColor: kit.colors.secondary }}
                            title={`Secondary: ${kit.colors.secondary}`}
                          />
                        )}
                        <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 ml-2">
                          {kit.fonts.display}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
                      Created {new Date(kit.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Brand Kit Modal */}
      <BrandKitModal
        isOpen={isBrandKitModalOpen}
        onClose={() => setIsBrandKitModalOpen(false)}
        onApplyBrandKit={async (kit) => {
          try {
            await fetch("/api/brand-kits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(kit),
            });
            loadBrandKits();
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </div>
  );
}
