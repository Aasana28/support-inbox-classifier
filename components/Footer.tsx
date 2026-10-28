import React from "react";
import { ShieldCheck, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Demo with synthetic data. Nothing is stored.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Brightwave Digital • Ahmedabad (Gujarat)</span>
          <span>•</span>
          <span>Groq & Gemini Embeddings RAG</span>
        </div>
      </div>
    </footer>
  );
}
