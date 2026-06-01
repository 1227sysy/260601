"use client";

import { useEffect, useState } from "react";
import KPICard from "./KPICard";
import type { KPIData } from "@/types/cheongyak";

interface Props {
  onTabChange: (tab: string) => void;
}

const previewCards = [
  {
    tab: "gonggo",
    title: "분양공고",
    desc: "전국 아파트·오피스텔 모집 공고를 지역별로 확인하세요.",
    icon: "🏢",
    color: "border-blue-500/30 hover:border-blue-400",
    badge: "지역 필터 · 차트 분석",
  },
  {
    tab: "gyeongjaengnyul",
    title: "경쟁률",
    desc: "단지별·평형별 청약 경쟁률과 가점 분포를 분석하세요.",
    icon: "📊",
    color: "border-emerald-500/30 hover:border-emerald-400",
    badge: "실시간 현황 · 특별공급",
  },
  {
    tab: "dangjeon",
    title: "당첨분석",
    desc: "지역·연령·가점 통계로 당첨 패턴을 파악하세요.",
    icon: "🗺️",
    color: "border-purple-500/30 hover:border-purple-400",
    badge: "코로플레스 지도 · 연령별",
  },
];

export default function LandingPage({ onTabChange }: Props) {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [gRes, gyrRes] = await Promise.all([
          fetch("/api/cheongyak/gonggo?perPage=100"),
          fetch("/api/cheongyak/gyeongjaengnyul"),
        ]);
        const gData = await gRes.json();
        const gyrData = await gyrRes.json();

        const now = new Date();
        const thisMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const monthly = gData.data.filter((d: { RCRIT_PBLANC_DE: string }) =>
          d.RCRIT_PBLANC_DE.startsWith(thisMonth)
        ).length;

        const topRate = Math.max(...gyrData.data.map((d: { COMPETITION_RATE: number }) => d.COMPETITION_RATE));
        const avgScore = Math.round(
          gyrData.data.reduce((sum: number, d: { SCORE_AVG: number }) => sum + d.SCORE_AVG, 0) /
            gyrData.data.length
        );

        setKpi({ monthlyGonggo: monthly || gData.total, topCompetitionRate: topRate, avgScore, topWinAge: "40대" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          한국 청약 시장 분석 대시보드
        </h1>
        <p className="text-slate-400">
          한국부동산원 공공데이터 API 기반 실시간 청약 현황 · 경쟁률 · 당첨 통계
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-5 border border-slate-700 animate-pulse h-28" />
          ))
        ) : (
          <>
            <KPICard
              title="이번달 공고 건수"
              value={kpi?.monthlyGonggo ?? "—"}
              unit="건"
              sub="2026년 6월"
              color="blue"
              icon="📋"
            />
            <KPICard
              title="최고 경쟁률"
              value={kpi?.topCompetitionRate.toFixed(1) ?? "—"}
              unit=":1"
              sub="래미안 원베일리 59㎡"
              color="emerald"
              icon="🔥"
            />
            <KPICard
              title="평균 가점"
              value={kpi?.avgScore ?? "—"}
              unit="점"
              sub="전국 당첨자 평균"
              color="amber"
              icon="⭐"
            />
            <KPICard
              title="최다 당첨 연령"
              value={kpi?.topWinAge ?? "—"}
              sub="전국 평균 기준"
              color="purple"
              icon="👤"
            />
          </>
        )}
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">분석 메뉴</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {previewCards.map((card) => (
          <button
            key={card.tab}
            onClick={() => onTabChange(card.tab)}
            className={`bg-slate-800 border ${card.color} rounded-xl p-6 text-left transition-all hover:bg-slate-750 group`}
          >
            <div className="text-4xl mb-3">{card.icon}</div>
            <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-blue-300 transition-colors">
              {card.title}
            </h3>
            <p className="text-slate-400 text-sm mb-3">{card.desc}</p>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
              {card.badge}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
        <p className="text-slate-500 text-xs">
          데이터 출처: 한국부동산원 공공데이터포털 · API ID 15098547 / 15098905 / 15110812
          <span className="ml-3 text-slate-600">· 샘플 데이터 기반 (실 API 키 설정 시 실시간 연동)</span>
        </p>
      </div>
    </div>
  );
}
