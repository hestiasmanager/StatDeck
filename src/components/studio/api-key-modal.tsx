"use client";

import React, { useState, useEffect } from "react";
import { Key, X, Check, ExternalLink, Sparkles, Cpu } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_OPENROUTER_MODELS = [
  { id: "google/gemini-4-hydrogen", name: "Gemini 4 Hydrogen (Primary, Fast & Deep Reasoning)" },
  { id: "google/gemini-3.8-flash", name: "Gemini 3.8 Flash (Fast Fallback)" },
  { id: "google/gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite (Ultra-Fast)" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (Ultra-Fast & Production Stable)" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o-mini (Reliable & Structured)" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku (Sharp Editorial Prose)" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3 (Ultra-Low Cost)" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B (High Power Open)" },
];

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState("google/gemini-2.5-flash");
  const [geminiKey, setGeminiKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [activeTab, setActiveTab] = useState<"openrouter" | "direct">("openrouter");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cleanKey = (k: string | null) => {
        if (!k) return "";
        if (k.includes("REDACTED") || k.includes("dummy") || k.includes("test")) return "";
        return k;
      };

      const orKey = cleanKey(localStorage.getItem("statdeck_openrouter_key"));
      const gemKey = cleanKey(localStorage.getItem("statdeck_gemini_key"));
      const oaiKey = cleanKey(localStorage.getItem("statdeck_openai_key"));

      // Scrub invalid placeholder keys if they were accidentally saved
      if (!orKey && localStorage.getItem("statdeck_openrouter_key")) {
        localStorage.removeItem("statdeck_openrouter_key");
      }
      if (!gemKey && localStorage.getItem("statdeck_gemini_key")) {
        localStorage.removeItem("statdeck_gemini_key");
      }
      if (!oaiKey && localStorage.getItem("statdeck_openai_key")) {
        localStorage.removeItem("statdeck_openai_key");
      }

      setOpenRouterKey(orKey);
      setOpenRouterModel(localStorage.getItem("statdeck_openrouter_model") || "google/gemini-2.5-flash");
      setGeminiKey(gemKey);
      setOpenAiKey(oaiKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      if (openRouterKey.trim()) {
        localStorage.setItem("statdeck_openrouter_key", openRouterKey.trim());
        localStorage.setItem("statdeck_openrouter_model", openRouterModel.trim());
      } else {
        localStorage.removeItem("statdeck_openrouter_key");
        localStorage.removeItem("statdeck_openrouter_model");
      }

      if (geminiKey.trim()) {
        localStorage.setItem("statdeck_gemini_key", geminiKey.trim());
      } else {
        localStorage.removeItem("statdeck_gemini_key");
      }

      if (openAiKey.trim()) {
        localStorage.setItem("statdeck_openai_key", openAiKey.trim());
      } else {
        localStorage.removeItem("statdeck_openai_key");
      }
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              AI Provider Settings
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("openrouter")}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "openrouter"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>OpenRouter (Unified)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("direct")}
            className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "direct"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Direct Keys (Google/OpenAI)</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {/* TAB 1: OpenRouter */}
          {activeTab === "openrouter" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    OpenRouter API Key
                  </label>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Model Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select AI Model
                </label>
                <select
                  value={openRouterModel}
                  onChange={(e) => setOpenRouterModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {POPULAR_OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500">
                  Model ID: <code className="font-mono text-blue-600 dark:text-blue-400">{openRouterModel}</code>
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Direct Keys */}
          {activeTab === "direct" && (
            <div className="flex flex-col gap-3">
              {/* Gemini Key */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Google Gemini API Key
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* OpenAI Key */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    OpenAI API Key
                  </label>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>
              If left blank, StatDeck will use its <strong>intelligent heuristic parser</strong> to accurately extract numbers, columns, and steps from your files and URLs with zero tokens used.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
