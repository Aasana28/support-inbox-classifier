"use client";

import React, { useState, useEffect } from "react";
import { GuidanceDocMeta } from "@/lib/types";
import {
  BookOpen,
  Search,
  CheckCircle2,
  Calendar,
  UserCheck,
  Tag,
  Copy,
  Check,
  X,
  FileText,
} from "lucide-react";

export function GuidanceTab() {
  const [docs, setDocs] = useState<GuidanceDocMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [activeDoc, setActiveDoc] = useState<GuidanceDocMeta | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDocs() {
      try {
        setLoading(true);
        const res = await fetch("/api/guidance");
        const data = await res.json();
        if (data.docs) {
          setDocs(data.docs);
          if (data.docs.length > 0) {
            setActiveDoc(data.docs[0]);
          }
        } else {
          setError(data.error || "Failed to load guidance documents.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  const topics = ["all", ...Array.from(new Set(docs.map((d) => d.topic)))];

  const filteredDocs = docs.filter((doc) => {
    const matchesTopic = selectedTopic === "all" || doc.topic === selectedTopic;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  const handleCopyContent = () => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#2F5D8A] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-600 font-medium">
              Loading approved guidance repository...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-700">
          <p className="font-medium">Error loading guidance library</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header and Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2F5D8A]" />
            Approved Response Guidance Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standard operating procedures, turnaround times, and approved reply templates for Brightwave Digital.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guidance policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F5D8A] focus:border-transparent"
            />
          </div>

          {/* Topic filter dropdown */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2F5D8A]"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Topics (10)" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Table & Preview Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Policy Documents Table (Left) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Approved Policies ({filteredDocs.length})
            </span>
            <span className="text-xs text-slate-500">Click row to preview document</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No policies match your search filter.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDoc(doc)}
                    className={`w-full text-left px-4 py-3.5 transition-colors duration-150 flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-[#2F5D8A]/5 border-l-4 border-l-[#2F5D8A]"
                        : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          isSelected ? "text-[#2F5D8A]" : "text-slate-900"
                        }`}
                      >
                        {doc.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-700">{doc.topic}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        {doc.owner}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {doc.updated}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Document Preview (Right) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
          {activeDoc ? (
            <div>
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    {activeDoc.id}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {activeDoc.title}
                  </h2>
                </div>
                <button
                  onClick={handleCopyContent}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-colors"
                  title="Copy full document text"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-5 max-h-[580px] overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {/* Meta Summary Badge Row */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Topic
                    </span>
                    <span className="font-medium text-slate-800">{activeDoc.topic}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Owner
                    </span>
                    <span className="font-medium text-slate-800">{activeDoc.owner}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Last Updated
                    </span>
                    <span className="font-medium text-slate-800">{activeDoc.updated}</span>
                  </div>
                </div>

                {/* Render Markdown Sections */}
                <div className="prose prose-slate max-w-none text-slate-700 prose-headings:font-bold prose-headings:text-slate-900 prose-headings:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 whitespace-pre-wrap font-sans">
                  {activeDoc.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-slate-300" />
              <p className="text-sm">Select a policy on the left to preview content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
