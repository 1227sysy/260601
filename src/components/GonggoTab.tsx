"use client";

import { useEffect, useState, useRef } from "react";
import type { EChartsOption } from "echarts";
import type { GonggoItem } from "@/types/cheongyak";
import { SIDO_LIST } from "@/lib/mockData";

let ECharts: typeof import("echarts") | null = null;

export default function GonggoTab() {
  const [data, setData] = useState<GonggoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [sido, setSido] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const histRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<import("echarts").ECharts | null>(null);
  const donutChartRef = useRef<import("echarts").ECharts | null>(null);
  const histChartRef = useRef<import("echarts").ECharts | null>(null);
  const [allData, setAllData] = useState<GonggoItem[]>([]);

  useEffect(() => {
    import("echarts").then((ec) => {
      ECharts = ec;
    });
  }, []);

  useEffect(() => {
    fetch("/api/cheongyak/gonggo?perPage=100")
      .then((r) => r.json())
      .then((d) => setAllData(d.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), perPage: "10" });
    if (sido) params.set("sido", sido);
    fetch(`/api/cheongyak/gonggo?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  }, [sido, page]);

  useEffect(() => {
    if (!ECharts || !allData.length) return;

    const sidoCounts = allData.reduce<Record<string, number>>((acc, item) => {
      acc[item.SIDO] = (acc[item.SIDO] || 0) + 1;
      return acc;
    }, {});
    const top10 = Object.entries(sidoCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const typeCounts = allData.reduce<Record<string, number>>((acc, item) => {
      const key = item.SUBSCRPT_AREA_CODE_NM || "기타";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const supplyBuckets = [0, 0, 0, 0, 0];
    allData.forEach((item) => {
      const n = item.TOT_SUPLY_HSHLDCO;
      if (n < 100) supplyBuckets[0]++;
      else if (n < 300) supplyBuckets[1]++;
      else if (n < 500) supplyBuckets[2]++;
      else if (n < 800) supplyBuckets[3]++;
      else supplyBuckets[4]++;
    });

    if (barRef.current) {
      if (!barChartRef.current) barChartRef.current = ECharts.init(barRef.current);
      const opt: EChartsOption = {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        xAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "category", data: top10.map((d) => d[0].replace(/(특별자치시|특별자치도|광역시|특별시)/, "")), axisLabel: { color: "#94a3b8" } },
        series: [{ type: "bar", data: top10.map((d) => d[1]), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#3b82f6" }, { offset: 1, color: "#06b6d4" }] } }, label: { show: true, position: "right", color: "#94a3b8" } }],
        grid: { left: 60, right: 40, top: 10, bottom: 10 },
      };
      barChartRef.current.setOption(opt);
    }

    if (donutRef.current) {
      if (!donutChartRef.current) donutChartRef.current = ECharts.init(donutRef.current);
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
      const opt: EChartsOption = {
        backgroundColor: "transparent",
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { color: "#94a3b8" } },
        series: [{
          type: "pie", radius: ["40%", "70%"], center: ["50%", "45%"],
          data: Object.entries(typeCounts).map(([name, value], i) => ({ name, value, itemStyle: { color: colors[i % colors.length] } })),
          label: { color: "#94a3b8" },
        }],
      };
      donutChartRef.current.setOption(opt);
    }

    if (histRef.current) {
      if (!histChartRef.current) histChartRef.current = ECharts.init(histRef.current);
      const opt: EChartsOption = {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: ["100미만", "100~300", "300~500", "500~800", "800+"], axisLabel: { color: "#94a3b8" }, axisLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
        series: [{ type: "bar", data: supplyBuckets, itemStyle: { color: "#8b5cf6" }, label: { show: true, position: "top", color: "#94a3b8" } }],
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
      };
      histChartRef.current.setOption(opt);
    }
  }, [allData]);

  const perPage = 10;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">분양공고</h2>
        <select
          value={sido}
          onChange={(e) => { setSido(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">전체 지역</option>
          {SIDO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
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
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((item, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{item.HOUSE_NM}</td>
                    <td className="px-4 py-3 text-slate-300">{item.SIDO} {item.SIGUNGU}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${item.HOUSE_SECD_NM === "아파트" ? "bg-blue-900 text-blue-300" : "bg-amber-900 text-amber-300"}`}>
                        {item.HOUSE_SECD_NM}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{item.TOT_SUPLY_HSHLDCO.toLocaleString()}세대</td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.RCRIT_PBLANC_DE.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
          <span className="text-slate-500 text-xs">총 {total}건</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-sm disabled:opacity-40"
            >이전</button>
            <span className="text-slate-400 text-sm px-2">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-sm disabled:opacity-40"
            >다음</button>
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
