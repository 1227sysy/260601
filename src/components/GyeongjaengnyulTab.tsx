"use client";

import { useEffect, useState, useRef } from "react";
import type { EChartsOption } from "echarts";
import type { GyeongjaengnyulItem } from "@/types/cheongyak";

let ECharts: typeof import("echarts") | null = null;

const HOUSE_NAMES = [
  "래미안 원베일리",
  "힐스테이트 광교",
  "e편한세상 해운대",
  "자이 더 스타",
  "더샵 센트럴포레",
  "아이파크 광명",
];

export default function GyeongjaengnyulTab() {
  const [data, setData] = useState<GyeongjaengnyulItem[]>([]);
  const [selected, setSelected] = useState(HOUSE_NAMES[0]);
  const [loading, setLoading] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<import("echarts").ECharts | null>(null);
  const scoreChartRef = useRef<import("echarts").ECharts | null>(null);
  const stackChartRef = useRef<import("echarts").ECharts | null>(null);

  useEffect(() => {
    import("echarts").then((ec) => { ECharts = ec; });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cheongyak/gyeongjaengnyul?houseName=${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .finally(() => setLoading(false));
  }, [selected]);

  useEffect(() => {
    if (!ECharts || !data.length) return;

    const filtered = data.filter((d) => d.HOUSE_NM === selected);

    if (barRef.current) {
      if (!barChartRef.current) barChartRef.current = ECharts.init(barRef.current);
      const opt: EChartsOption = {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis", formatter: (params: unknown) => {
          const arr = params as Array<{ name: string; seriesName: string; value: number }>;
          return arr.map((p) => `${p.seriesName}: ${p.value}:1`).join("<br/>");
        }},
        legend: { textStyle: { color: "#94a3b8" } },
        xAxis: { type: "category", data: filtered.map((d) => d.HOUSING_TYPE), axisLabel: { color: "#94a3b8" }, axisLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "value", name: "경쟁률", nameTextStyle: { color: "#94a3b8" }, axisLabel: { color: "#94a3b8", formatter: "{value}:1" }, splitLine: { lineStyle: { color: "#334155" } } },
        series: [{ name: "경쟁률", type: "bar", data: filtered.map((d) => d.COMPETITION_RATE), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#10b981" }, { offset: 1, color: "#064e3b" }] } }, label: { show: true, position: "top", color: "#94a3b8", formatter: "{c}:1" } }],
        grid: { left: 60, right: 20, top: 40, bottom: 30 },
      };
      barChartRef.current.setOption(opt, true);
    }

    if (scoreRef.current) {
      if (!scoreChartRef.current) scoreChartRef.current = ECharts.init(scoreRef.current);
      const types = filtered.map((d) => d.HOUSING_TYPE);
      const opt: EChartsOption = {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        legend: { textStyle: { color: "#94a3b8" } },
        xAxis: { type: "category", data: types, axisLabel: { color: "#94a3b8" }, axisLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "value", name: "가점", nameTextStyle: { color: "#94a3b8" }, min: 0, max: 84, axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
        series: [
          { name: "최고", type: "bar", stack: "score", data: filtered.map((d) => d.SCORE_MAX - d.SCORE_AVG), itemStyle: { color: "#3b82f6" }, label: { show: false } },
          { name: "평균", type: "bar", stack: "score", data: filtered.map((d) => d.SCORE_AVG - d.SCORE_MIN), itemStyle: { color: "#f59e0b" }, label: { show: false } },
          { name: "최저", type: "bar", stack: "score", data: filtered.map((d) => d.SCORE_MIN), itemStyle: { color: "#334155" }, label: { show: false } },
          { name: "평균선", type: "line", data: filtered.map((d) => d.SCORE_AVG), itemStyle: { color: "#f59e0b" }, lineStyle: { width: 2 }, symbol: "circle" },
        ],
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
      };
      scoreChartRef.current.setOption(opt, true);
    }

    if (stackRef.current) {
      if (!stackChartRef.current) stackChartRef.current = ECharts.init(stackRef.current);
      const allHouses = [...new Set(data.map((d) => d.HOUSE_NM))];
      const specials = allHouses.map((name) => {
        const items = data.filter((d) => d.HOUSE_NM === name);
        return items.reduce((sum, d) => sum + d.SPECIAL_SUPPLY, 0);
      });
      const generals = allHouses.map((name) => {
        const items = data.filter((d) => d.HOUSE_NM === name);
        const sp = items.reduce((sum, d) => sum + d.SPECIAL_SUPPLY, 0);
        const total = items.reduce((sum, d) => sum + d.SPECIAL_SUPPLY * 2.5, 0);
        return Math.round(total - sp);
      });

      const opt: EChartsOption = {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { textStyle: { color: "#94a3b8" } },
        xAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "category", data: allHouses.map((n) => n.length > 8 ? n.slice(0, 8) + "…" : n), axisLabel: { color: "#94a3b8", fontSize: 11 } },
        series: [
          { name: "특별공급", type: "bar", stack: "total", data: specials, itemStyle: { color: "#8b5cf6" } },
          { name: "일반공급", type: "bar", stack: "total", data: generals, itemStyle: { color: "#3b82f6" } },
        ],
        grid: { left: 80, right: 20, top: 30, bottom: 10 },
      };
      stackChartRef.current.setOption(opt, true);
    }
  }, [data, selected]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">경쟁률 분석</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          {HOUSE_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-3">평형별 경쟁률</h3>
              <div ref={barRef} style={{ height: 260 }} />
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-3">가점 분포 (최저 / 평균 / 최고)</h3>
              <div ref={scoreRef} style={{ height: 260 }} />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-white font-semibold mb-3">단지별 공급 유형 (특별 vs 일반)</h3>
            <div ref={stackRef} style={{ height: 300 }} />
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.filter((d) => d.HOUSE_NM === selected).map((item, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">{item.HOUSING_TYPE}</p>
                <p className="text-2xl font-bold text-emerald-400">{item.COMPETITION_RATE.toFixed(1)}:1</p>
                <p className="text-slate-500 text-xs mt-1">평균가점 {item.SCORE_AVG}점</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
