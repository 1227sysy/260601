"use client";

import { useState } from "react";
import Header from "@/components/Header";
import LandingPage from "@/components/LandingPage";
import GonggoTab from "@/components/GonggoTab";
import GyeongjaengnyulTab from "@/components/GyeongjaengnyulTab";
import DangjeonTab from "@/components/DangjeonTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState("landing");

  return (
    <div className="min-h-screen bg-slate-950">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {activeTab === "landing" && <LandingPage onTabChange={setActiveTab} />}
        {activeTab === "gonggo" && <GonggoTab />}
        {activeTab === "gyeongjaengnyul" && <GyeongjaengnyulTab />}
        {activeTab === "dangjeon" && <DangjeonTab />}
      </main>
    </div>
  );
}
