"use client";

import React from "react";
import { Inbox, BookOpen, CheckCircle2 } from "lucide-react";

export type TabType = "inbox" | "guidance" | "quality";

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  emailCount?: number;
  guidanceCount?: number;
}

export function Navbar({
  activeTab,
  onTabChange,
  emailCount = 25,
  guidanceCount = 10,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0 sm:h-16 gap-2">
          {/* Top Row on mobile: Logo & Title */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#2F5D8A] text-white flex items-center justify-center font-bold text-base shadow-sm">
                B
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                    Brightwave Support Inbox
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Ahmedabad
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  AI Classifier & Grounded Draft Responder with Human Approval
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs: Full width 3-col grid on mobile, row on desktop */}
          <nav
            className="grid grid-cols-3 sm:flex sm:items-center gap-1 sm:gap-2 w-full sm:w-auto"
            aria-label="Tabs"
          >
            <button
              onClick={() => onTabChange("inbox")}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 ${
                activeTab === "inbox"
                  ? "bg-[#2F5D8A] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Inbox className="w-3.5 h-3.5 shrink-0" />
              <span>Inbox</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  activeTab === "inbox"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {emailCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange("guidance")}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 ${
                activeTab === "guidance"
                  ? "bg-[#2F5D8A] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Guidance</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  activeTab === "guidance"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {guidanceCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange("quality")}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 ${
                activeTab === "quality"
                  ? "bg-[#2F5D8A] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Quality Checks</span>
              <span className="sm:hidden">Quality</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  activeTab === "quality"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                16
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

