"use client";

import { useEffect, useState, useRef } from "react";
import type { EChartsOption } from "echarts";
import type { DangjeonItem } from "@/types/cheongyak";

let ECharts: typeof import("echarts") | null = null;
let mapRegistered = false;

const SIDO_LABEL_MAP: Record<string, string> = {
  "서울특별시": "서울",
  "부산광역시": "부산",
  "대구광역시": "대구",
  "인천광역시": "인천",
  "광주광역시": "광주",
  "대전광역시": "대전",
  "울산광역시": "울산",
  "세종특별자치시": "세종",
  "경기도": "경기",
  "강원도": "강원",
  "충청북도": "충북",
  "충청남도": "충남",
  "전라북도": "전북",
  "전라남도": "전남",
  "경상북도": "경북",
  "경상남도": "경남",
  "제주특별자치도": "제주",
};

// GeoJSON name → our SIDO name
const GEO_TO_SIDO: Record<string, string> = {
  "서울특별시": "서울특별시",
  "부산광역시": "부산광역시",
  "대구광역시": "대구광역시",
  "인천광역시": "인천광역시",
  "광주광역시": "광주광역시",
  "대전광역시": "대전광역시",
  "울산광역시": "울산광역시",
  "세종특별자치시": "세종특별자치시",
  "경기도": "경기도",
  "강원도": "강원도",
  "충청북도": "충청북도",
  "충청남도": "충청남도",
  "전라북도": "전라북도",
  "전라남도": "전라남도",
  "경상북도": "경상북도",
  "경상남도": "경상남도",
  "제주특별자치도": "제주특별자치도",
};

export default function DangjeonTab() {
  const [data, setData] = useState<DangjeonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const ageRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const mapChartRef = useRef<import("echarts").ECharts | null>(null);
  const ageChartRef = useRef<import("echarts").ECharts | null>(null);
  const scoreChartRef = useRef<import("echarts").ECharts | null>(null);

  useEffect(() => {
    fetch("/api/cheongyak/dangjeon")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data.length) return;

    async function renderCharts() {
      const ec = await import("echarts");
      ECharts = ec;

      if (!mapRegistered) {
        try {
          const geoRes = await fetch("/maps/korea-provinces.json");
          const geoJson = await geoRes.json();
          ec.registerMap("korea", geoJson);
          mapRegistered = true;
        } catch {
          console.warn("Failed to load Korea map GeoJSON");
        }
      }

      // Aggregate win counts by sido
      const sidoWins: Record<string, number> = {};
      data.forEach((item) => {
        sidoWins[item.SIDO] = (sidoWins[item.SIDO] || 0) + item.WIN_CNT;
      });

      const mapData = Object.entries(GEO_TO_SIDO).map(([geoName, sidoName]) => ({
        name: geoName,
        value: sidoWins[sidoName] || 0,
      }));

      if (mapRef.current && mapRegistered) {
        if (!mapChartRef.current) mapChartRef.current = ec.init(mapRef.current);
        const opt: EChartsOption = {
          backgroundColor: "transparent",
          tooltip: {
            trigger: "item",
            formatter: (params: unknown) => {
              const p = params as { name: string; value: number };
              const sido = GEO_TO_SIDO[p.name] || p.name;
              const short = SIDO_LABEL_MAP[sido] || sido;
              return `${short}<br/>당첨자 수: <b>${(p.value || 0).toLocaleString()}명</b>`;
            },
          },
          visualMap: {
            min: 0,
            max: Math.max(...Object.values(sidoWins)),
            left: "left",
            top: "bottom",
            text: ["높음", "낮음"],
            calculable: true,
            inRange: { color: ["#1e3a5f", "#3b82f6", "#06b6d4"] },
            textStyle: { color: "#94a3b8" },
          },
          series: [{
            name: "당첨자 수",
            type: "map",
            map: "korea",
            roam: true,
            data: mapData,
            emphasis: { label: { show: true, color: "#fff" }, itemStyle: { areaColor: "#f59e0b" } },
            label: { show: true, color: "#94a3b8", fontSize: 10, formatter: (p: { name: string }) => SIDO_LABEL_MAP[p.name] || p.name },
            itemStyle: { borderColor: "#475569", borderWidth: 1 },
          }],
        };
        mapChartRef.current.setOption(opt, true);
      }

      // Age chart
      const ages = ["20대", "30대", "40대", "50대"];
      const applyByAge = ages.map((age) =>
        data.filter((d) => d.AGE_GBN === age).reduce((sum, d) => sum + d.APPLY_CNT, 0)
      );
      const winByAge = ages.map((age) =>
        data.filter((d) => d.AGE_GBN === age).reduce((sum, d) => sum + d.WIN_CNT, 0)
      );

      if (ageRef.current) {
        if (!ageChartRef.current) ageChartRef.current = ec.init(ageRef.current);
        const opt: EChartsOption = {
          backgroundColor: "transparent",
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          legend: { textStyle: { color: "#94a3b8" } },
          xAxis: { type: "category", data: ages, axisLabel: { color: "#94a3b8" }, axisLine: { lineStyle: { color: "#334155" } } },
          yAxis: [
            { type: "value", name: "신청", axisLabel: { color: "#94a3b8", formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v) }, splitLine: { lineStyle: { color: "#334155" } } },
            { type: "value", name: "당첨", axisLabel: { color: "#94a3b8", formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v) }, splitLine: { show: false } },
          ],
          series: [
            { name: "신청자", type: "bar", data: applyByAge, itemStyle: { color: "#3b82f6" }, label: { show: false } },
            { name: "당첨자", type: "bar", yAxisIndex: 1, data: winByAge, itemStyle: { color: "#10b981" }, label: { show: false } },
          ],
          grid: { left: 50, right: 50, top: 40, bottom: 30 },
        };
        ageChartRef.current.setOption(opt, true);
      }

      // Score multi-line chart
      const sidoList = [...new Set(data.map((d) => d.SIDO))].slice(0, 5);
      const scoreRanks = ["저", "중", "고"];

      if (scoreRef.current) {
        if (!scoreChartRef.current) scoreChartRef.current = ec.init(scoreRef.current);
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
        const series = sidoList.map((sido, i) => {
          const winData = scoreRanks.map((rank) => {
            const items = data.filter((d) => d.SIDO === sido && d.SCORE_RANK === rank);
            return items.reduce((sum, d) => sum + d.WIN_CNT, 0);
          });
          return {
            name: SIDO_LABEL_MAP[sido] || sido,
            type: "line" as const,
            data: winData,
            smooth: true,
            lineStyle: { color: colors[i] },
            itemStyle: { color: colors[i] },
          };
        });

        const opt: EChartsOption = {
          backgroundColor: "transparent",
          tooltip: { trigger: "axis" },
          legend: { textStyle: { color: "#94a3b8" } },
          xAxis: { type: "category", data: ["저가점", "중가점", "고가점"], axisLabel: { color: "#94a3b8" }, axisLine: { lineStyle: { color: "#334155" } } },
          yAxis: { type: "value", name: "당첨자", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
          series,
          grid: { left: 50, right: 20, top: 40, bottom: 30 },
        };
        scoreChartRef.current.setOption(opt, true);
      }
    }

    renderCharts();
  }, [data]);

  const sidoSummary = Object.entries(
    data.reduce<Record<string, { apply: number; win: number }>>((acc, item) => {
      if (!acc[item.SIDO]) acc[item.SIDO] = { apply: 0, win: 0 };
      acc[item.SIDO].apply += item.APPLY_CNT;
      acc[item.SIDO].win += item.WIN_CNT;
      return acc;
    }, {})
  )
    .map(([sido, v]) => ({ sido, ...v, rate: ((v.win / v.apply) * 100).toFixed(2) }))
    .sort((a, b) => b.win - a.win);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">당첨 분석</h2>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-3">지역별 당첨자 수 (코로플레스 지도)</h3>
              <div ref={mapRef} style={{ height: 360 }} />
            </div>
            <div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
                <h3 className="text-white font-semibold mb-3">연령별 신청 vs 당첨</h3>
                <div ref={ageRef} style={{ height: 220 }} />
              </div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-white font-semibold mb-3">지역별 가점 구간 당첨 추이</h3>
                <div ref={scoreRef} style={{ height: 220 }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-white font-semibold">지역별 당첨 통계</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900">
                  <th className="text-left text-slate-400 px-4 py-3 font-medium">지역</th>
                  <th className="text-right text-slate-400 px-4 py-3 font-medium">총 신청자</th>
                  <th className="text-right text-slate-400 px-4 py-3 font-medium">당첨자</th>
                  <th className="text-right text-slate-400 px-4 py-3 font-medium">당첨률</th>
                  <th className="text-left text-slate-400 px-4 py-3 font-medium">비율 바</th>
                </tr>
              </thead>
              <tbody>
                {sidoSummary.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{SIDO_LABEL_MAP[row.sido] || row.sido}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{row.apply.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-medium">{row.win.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-amber-400 font-medium">{row.rate}%</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(parseFloat(row.rate) * 4, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
