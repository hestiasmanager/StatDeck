"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Code2, Check, ArrowUpRight } from "lucide-react";

interface SharePageActionsProps {
  token: string;
}

export function SharePageActions({ token }: SharePageActionsProps) {
  const [hasCopiedEmbed, setHasCopiedEmbed] = useState(false);

  const handleCopyEmbed = async () => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || "");
    const iframeSnippet = `<iframe src="${origin}/s/${token}?embed=1" width="100%" height="700" frameborder="0" style="border:none; border-radius:16px; overflow:hidden;" allow="clipboard-write"></iframe>`;
    try {
      await navigator.clipboard.writeText(iframeSnippet);
      setHasCopiedEmbed(true);
      setTimeout(() => setHasCopiedEmbed(false), 2500);
    } catch {
      alert("Failed to copy embed code.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Copy Embed Code */}
      <button
        onClick={handleCopyEmbed}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
        title="Copy responsive iframe embed snippet"
      >
        {hasCopiedEmbed ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Code2 className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span>{hasCopiedEmbed ? "Embed Copied!" : "Copy Embed Code"}</span>
      </button>

      {/* Remix with Your Data */}
      <Link
        href={`/studio?remix=${encodeURIComponent(token)}`}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/25 group cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
        <span>Remix with Your Data</span>
        <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
      </Link>
    </div>
  );
}
