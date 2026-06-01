"use client";

import { useEffect, useState, useRef } from "react";
import type { EChartsOption } from "echarts";

interface GonggoItem {
  HOUSE_NM: string;
  HOUSE_SECD_NM: string;
  SUBSCRPT_AREA_CODE_NM: string;
  HSSPLY_ADRES: string;
  RCRIT_PBLANC_DE: string;
  TOT_SUPLY_HSHLDCO: number;
  HOUSE_MANAGE_NO: string;
  // mock compat
  SIDO?: string;
}

const AREA_LABELS = ["서울","경기","인천","부산","대구","대전","광주","울산","세종","강원","충북","충남","전북","전남","경북","경남","제주"];

let EC: typeof import("echarts") | null = null;

export default function GonggoTab() {
  const [data, setData] = useState<GonggoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [area, setArea] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [allData, setAllData] = useState<GonggoItem[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const histRef = useRef<HTMLDivElement>(null);
  const barChart = useRef<import("echarts").ECharts | null>(null);
  const donutChart = useRef<import("echarts").ECharts | null>(null);
  const histChart = useRef<import("echarts").ECharts | null>(null);

  useEffect(() => { import("echarts").then((ec) => { EC = ec; }); }, []);

  useEffect(() => {
    fetch("/api/cheongyak/gonggo?perPage=100")
      .then((r) => r.json())
      .then((d) => setAllData(d.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), perPage: "10" });
    if (area) params.set("sido", area);
    fetch(`/api/cheongyak/gonggo?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data); setTotal(d.total); setSource(d.source); })
      .finally(() => setLoading(false));
  }, [area, page]);

  const getArea = (item: GonggoItem) =>
    item.SUBSCRPT_AREA_CODE_NM || item.SIDO?.replace(/(특별자치시|특별자치도|광역시|특별시|도)$/, "") || "";

  const getType = (item: GonggoItem) =>
    item.HOUSE_SECD_NM || "기타";

  useEffect(() => {
    if (!EC || !allData.length) return;

    const areaCounts: Record<string, number> = {};
    allData.forEach((item) => {
      const a = getArea(item);
      if (a) areaCounts[a] = (areaCounts[a] || 0) + 1;
    });
    const top10 = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const typeCounts: Record<string, number> = {};
    allData.forEach((item) => {
      const t = getType(item).split("(")[0].trim() || "기타";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    const supplyBuckets = [0, 0, 0, 0, 0];
    allData.forEach((item) => {
      const n = Number(item.TOT_SUPLY_HSHLDCO);
      if (n < 100) supplyBuckets[0]++;
      else if (n < 300) supplyBuckets[1]++;
      else if (n < 500) supplyBuckets[2]++;
      else if (n < 800) supplyBuckets[3]++;
      else supplyBuckets[4]++;
    });

    if (barRef.current) {
      if (!barChart.current) barChart.current = EC.init(barRef.current);
      barChart.current.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        xAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "category", data: top10.map((d) => d[0]), axisLabel: { color: "#94a3b8" } },
        series: [{ type: "bar", data: top10.map((d) => d[1]), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#3b82f6" }, { offset: 1, color: "#06b6d4" }] } }, label: { show: true, position: "right", color: "#94a3b8" } }],
        grid: { left: 60, right: 40, top: 10, bottom: 10 },
      } as EChartsOption, true);
    }

    if (donutRef.current) {
      if (!donutChart.current) donutChart.current = EC.init(donutRef.current);
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
      donutChart.current.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { color: "#94a3b8" } },
        series: [{ type: "pie", radius: ["40%", "70%"], center: ["50%", "42%"], data: Object.entries(typeCounts).map(([name, value], i) => ({ name: name.slice(0, 8), value, itemStyle: { color: colors[i % colors.length] } })), label: { color: "#94a3b8", fontSize: 11 } }],
      } as EChartsOption, true);
    }

    if (histRef.current) {
      if (!histChart.current) histChart.current = EC.init(histRef.current);
      histChart.current.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: ["100미만", "100~300", "300~500", "500~800", "800+"], axisLabel: { color: "#94a3b8" }, axisLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
        series: [{ type: "bar", data: supplyBuckets, itemStyle: { color: "#8b5cf6" }, label: { show: true, position: "top", color: "#94a3b8" } }],
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
      } as EChartsOption, true);
    }
  }, [allData]);

  const perPage = 10;
  const totalPages = Math.ceil(total / perPage);

  const formatDate = (d: string) =>
    d ? d.replace(/(\d{4})-?(\d{2})-?(\d{2})/, "$1.$2.$3") : "-";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">분양공고</h2>
          {source === "api" && (
            <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded">실시간 API</span>
          )}
        </div>
        <select
          value={area}
          onChange={(e) => { setArea(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
        >
          <option value="">전체 지역</option>
          {AREA_LABELS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900">
              <th className="text-left text-slate-400 px-4 py-3 font-medium">단지명</th>
              <th className="text-left text-slate-400 px-4 py-3 font-medium">지역</th>
              <th className="text-left text-slate-400 px-4 py-3 font-medium">주택구분</th>
              <th className="text-right text-slate-400 px-4 py-3 font-medium">공급세대</th>
              <th className="text-left text-slate-400 px-4 py-3 font-medium">모집공고일</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : data.map((item, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium max-w-xs truncate" title={item.HOUSE_NM}>{item.HOUSE_NM}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{getArea(item)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        getType(item).includes("APT") || getType(item).includes("민영")
                          ? "bg-blue-900 text-blue-300"
                          : getType(item).includes("신혼") || getType(item).includes("공공")
                          ? "bg-emerald-900 text-emerald-300"
                          : "bg-amber-900 text-amber-300"
                      }`}>
                        {getType(item).slice(0, 10)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{Number(item.TOT_SUPLY_HSHLDCO).toLocaleString()}세대</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(item.RCRIT_PBLANC_DE)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
          <span className="text-slate-500 text-xs">총 {total.toLocaleString()}건</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-sm disabled:opacity-40">이전</button>
            <span className="text-slate-400 text-sm px-2">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-sm disabled:opacity-40">다음</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-semibold mb-3">지역별 공고 Top 10</h3>
          <div ref={barRef} style={{ height: 280 }} />
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-semibold mb-3">주택구분별 비중</h3>
          <div ref={donutRef} style={{ height: 280 }} />
        </div>
      </div>
      <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 className="text-white font-semibold mb-3">공급세대 분포</h3>
        <div ref={histRef} style={{ height: 200 }} />
      </div>
    </div>
  );
}
