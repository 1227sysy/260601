"use client";

import { useEffect, useState, useRef } from "react";
import type { EChartsOption } from "echarts";

interface AreaItem {
  SUBSCRPT_AREA_CODE_NM: string;
  SUBSCRPT_AREA_CODE?: string;
  AGE_30: number; AGE_40: number; AGE_50: number; AGE_60: number;
  STAT_DE?: string;
  // mock compat
  SIDO?: string; WIN_CNT?: number;
}

// API 짧은 지역명 → GeoJSON 지역명 매핑
const SHORT_TO_GEO: Record<string, string> = {
  "서울": "서울특별시", "경기": "경기도", "인천": "인천광역시",
  "부산": "부산광역시", "대구": "대구광역시", "광주": "광주광역시",
  "대전": "대전광역시", "울산": "울산광역시", "세종": "세종특별자치시",
  "강원": "강원도", "충북": "충청북도", "충남": "충청남도",
  "전북": "전라북도", "전남": "전라남도", "경북": "경상북도",
  "경남": "경상남도", "제주": "제주특별자치도",
};

const SHORT_LABELS = Object.fromEntries(Object.entries(SHORT_TO_GEO).map(([k, v]) => [v, k]));

let EC: typeof import("echarts") | null = null;
let mapRegistered = false;

export default function DangjeonTab() {
  const [data, setData] = useState<AreaItem[]>([]);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const ageRef = useRef<HTMLDivElement>(null);
  const trendRef = useRef<HTMLDivElement>(null);
  const mapChart = useRef<import("echarts").ECharts | null>(null);
  const ageChart = useRef<import("echarts").ECharts | null>(null);
  const trendChart = useRef<import("echarts").ECharts | null>(null);

  useEffect(() => {
    fetch("/api/cheongyak/dangjeon?type=area")
      .then((r) => r.json())
      .then((d) => { setData(d.data); setSource(d.source); })
      .finally(() => setLoading(false));
  }, []);

  // 지역별 집계
  const areaAgg: Record<string, { total: number; short: string }> = {};
  data.forEach((item) => {
    const short = item.SUBSCRPT_AREA_CODE_NM || (item.SIDO ? SHORT_LABELS[item.SIDO] || item.SIDO : "");
    const total = (item.AGE_30 || 0) + (item.AGE_40 || 0) + (item.AGE_50 || 0) + (item.AGE_60 || 0);
    if (short) {
      areaAgg[short] = { total: (areaAgg[short]?.total || 0) + total, short };
    }
  });

  // 연령별 전국 집계
  const ageTotal = { "30대이하": 0, "40대": 0, "50대": 0, "60대이상": 0 };
  data.forEach((item) => {
    ageTotal["30대이하"] += item.AGE_30 || 0;
    ageTotal["40대"] += item.AGE_40 || 0;
    ageTotal["50대"] += item.AGE_50 || 0;
    ageTotal["60대이상"] += item.AGE_60 || 0;
  });

  // 월별 추이 (상위 3개 지역)
  const monthData: Record<string, Record<string, number>> = {};
  data.forEach((item) => {
    const month = item.STAT_DE || "unknown";
    const short = item.SUBSCRPT_AREA_CODE_NM || "";
    if (!monthData[month]) monthData[month] = {};
    const total = (item.AGE_30 || 0) + (item.AGE_40 || 0) + (item.AGE_50 || 0) + (item.AGE_60 || 0);
    monthData[month][short] = (monthData[month][short] || 0) + total;
  });
  const months = Object.keys(monthData).sort();
  const topAreas = Object.entries(areaAgg).sort((a, b) => b[1].total - a[1].total).slice(0, 4).map(([k]) => k);

  useEffect(() => {
    if (!data.length) return;

    async function render() {
      const ec = await import("echarts");
      EC = ec;

      if (!mapRegistered) {
        try {
          const geoRes = await fetch("/maps/korea-provinces.json");
          const geoJson = await geoRes.json();
          ec.registerMap("korea", geoJson);
          mapRegistered = true;
        } catch { /* no map */ }
      }

      const maxVal = Math.max(...Object.values(areaAgg).map((v) => v.total));

      if (mapRef.current && mapRegistered) {
        if (!mapChart.current) mapChart.current = ec.init(mapRef.current);
        mapChart.current.setOption({
          backgroundColor: "transparent",
          tooltip: {
            trigger: "item",
            formatter: (p: unknown) => {
              const item = p as { name: string; value: number };
              const short = SHORT_LABELS[item.name] || item.name;
              return `${short}<br/>당첨자 합계: <b>${(item.value || 0).toLocaleString()}명</b>`;
            },
          },
          visualMap: { min: 0, max: maxVal, left: "left", top: "bottom", text: ["높음", "낮음"], calculable: true, inRange: { color: ["#1e3a5f", "#3b82f6", "#06b6d4"] }, textStyle: { color: "#94a3b8" } },
          series: [{
            name: "당첨자 수", type: "map", map: "korea", roam: true,
            data: Object.entries(SHORT_TO_GEO).map(([short, geo]) => ({
              name: geo, value: areaAgg[short]?.total || 0,
            })),
            emphasis: { itemStyle: { areaColor: "#f59e0b" }, label: { show: true, color: "#fff" } },
            label: { show: true, color: "#94a3b8", fontSize: 10, formatter: (p: { name: string }) => SHORT_LABELS[p.name] || p.name },
            itemStyle: { borderColor: "#475569", borderWidth: 1 },
          }],
        } as EChartsOption, true);
      }

      if (ageRef.current) {
        if (!ageChart.current) ageChart.current = ec.init(ageRef.current);
        const ages = Object.keys(ageTotal);
        const vals = Object.values(ageTotal);
        ageChart.current.setOption({
          backgroundColor: "transparent",
          tooltip: { trigger: "item", formatter: (p: unknown) => {
            const item = p as { name: string; value: number; percent: number };
            return `${item.name}<br/>${item.value.toLocaleString()}명 (${item.percent}%)`;
          }},
          series: [{
            type: "pie", radius: "70%",
            data: ages.map((a, i) => ({ name: a, value: vals[i], itemStyle: { color: ["#3b82f6","#10b981","#f59e0b","#8b5cf6"][i] } })),
            label: { color: "#94a3b8", formatter: "{b}\n{d}%" },
          }],
        } as EChartsOption, true);
      }

      if (trendRef.current && months.length > 1) {
        if (!trendChart.current) trendChart.current = ec.init(trendRef.current);
        const colors = ["#3b82f6","#10b981","#f59e0b","#8b5cf6"];
        trendChart.current.setOption({
          backgroundColor: "transparent",
          tooltip: { trigger: "axis" },
          legend: { textStyle: { color: "#94a3b8" }, bottom: 0 },
          xAxis: { type: "category", data: months.map((m) => m.slice(0, 4) + "." + m.slice(4)), axisLabel: { color: "#94a3b8", rotate: 30, fontSize: 10 }, axisLine: { lineStyle: { color: "#334155" } } },
          yAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
          series: topAreas.map((area, i) => ({
            name: area,
            type: "line",
            smooth: true,
            data: months.map((m) => monthData[m]?.[area] || 0),
            itemStyle: { color: colors[i] },
            lineStyle: { color: colors[i] },
          })),
          grid: { left: 50, right: 20, top: 30, bottom: 60 },
        } as EChartsOption, true);
      }
    }
    render();
  }, [data]);

  const areaRows = Object.entries(areaAgg)
    .sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-white">당첨 분석</h2>
        {source === "api" && <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded">실시간 API</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1, 2].map((i) => <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 h-80 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-3">지역별 당첨자 수 (코로플레스 지도)</h3>
              <div ref={mapRef} style={{ height: 360 }} />
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-white font-semibold mb-3">연령대별 당첨자 비율</h3>
                <div ref={ageRef} style={{ height: 200 }} />
              </div>
              {months.length > 1 && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <h3 className="text-white font-semibold mb-3">지역별 월별 당첨 추이 (상위 4개 지역)</h3>
                  <div ref={trendRef} style={{ height: 200 }} />
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-white font-semibold">지역별 당첨자 통계</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900">
                  <th className="text-left text-slate-400 px-4 py-3 font-medium">지역</th>
                  <th className="text-right text-slate-400 px-4 py-3 font-medium">당첨자 합계</th>
                  <th className="text-left text-slate-400 px-4 py-3 font-medium">비율</th>
                </tr>
              </thead>
              <tbody>
                {areaRows.map(([area, { total }], i) => {
                  const max = areaRows[0][1].total;
                  return (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{area}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{total.toLocaleString()}</td>
                      <td className="px-4 py-3 w-48">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(total / max) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
