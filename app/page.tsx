"use client";

import React, { useState } from "react";
import { Navbar, TabType } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InboxTab } from "@/components/InboxTab";
import { GuidanceTab } from "@/components/GuidanceTab";
import { QualityChecksTab } from "@/components/QualityChecksTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("inbox");

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        emailCount={25}
        guidanceCount={10}
      />

      <main className="flex-1">
        {activeTab === "inbox" && <InboxTab />}
        {activeTab === "guidance" && <GuidanceTab />}
        {activeTab === "quality" && <QualityChecksTab />}
      </main>

      <Footer />
    </div>
  );
}
