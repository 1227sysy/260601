"use client";

import { useEffect, useState, useRef } from "react";
import type { EChartsOption } from "echarts";

interface HouseItem { HOUSE_MANAGE_NO: string; HOUSE_NM: string; SUBSCRPT_AREA_CODE_NM: string; }
interface CmpetItem { HOUSE_TY: string; SUPLY_HSHLDCO: string | number; REQ_CNT: string | number; CMPET_RATE: string; RESIDE_SENM?: string; }
interface ScoreItem { HOUSE_TY: string; AVRG_SCORE: string | number; LWET_SCORE: string | number; TOP_SCORE: string | number; RESIDE_SENM?: string; }

let EC: typeof import("echarts") | null = null;

export default function GyeongjaengnyulTab() {
  const [houses, setHouses] = useState<HouseItem[]>([]);
  const [selected, setSelected] = useState<HouseItem | null>(null);
  const [cmpetData, setCmpetData] = useState<CmpetItem[]>([]);
  const [scoreData, setScoreData] = useState<ScoreItem[]>([]);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [loading, setLoading] = useState(false);
  const [loadingHouses, setLoadingHouses] = useState(true);

  const barRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const barChart = useRef<import("echarts").ECharts | null>(null);
  const scoreChart = useRef<import("echarts").ECharts | null>(null);

  useEffect(() => { import("echarts").then((ec) => { EC = ec; }); }, []);

  useEffect(() => {
    fetch("/api/cheongyak/gyeongjaengnyul?type=list")
      .then((r) => r.json())
      .then((d) => {
        setHouses(d.data);
        if (d.data.length) setSelected(d.data[0]);
      })
      .finally(() => setLoadingHouses(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    const no = selected.HOUSE_MANAGE_NO;
    Promise.all([
      fetch(`/api/cheongyak/gyeongjaengnyul?houseManageNo=${no}&type=cmpet`).then((r) => r.json()),
      fetch(`/api/cheongyak/gyeongjaengnyul?houseManageNo=${no}&type=score`).then((r) => r.json()),
    ]).then(([cmpet, score]) => {
      setCmpetData(cmpet.data || []);
      setScoreData(score.data || []);
      setSource(cmpet.source || "mock");
    }).finally(() => setLoading(false));
  }, [selected]);

  // 평형별 집계 (해당지역 1순위 기준)
  const byType: Record<string, { ty: string; suply: number; req: number; rate: number }> = {};
  cmpetData.forEach((d) => {
    if (!byType[d.HOUSE_TY]) byType[d.HOUSE_TY] = { ty: d.HOUSE_TY, suply: 0, req: 0, rate: 0 };
    byType[d.HOUSE_TY].suply = Number(d.SUPLY_HSHLDCO);
    byType[d.HOUSE_TY].req += Number(d.REQ_CNT);
    byType[d.HOUSE_TY].rate = parseFloat(d.CMPET_RATE) || 0;
  });
  const types = Object.values(byType).filter((d) => d.rate > 0);

  // 가점 집계 (해당지역)
  const scoreByType = scoreData.filter((d) =>
    d.RESIDE_SENM === "해당지역" && parseFloat(String(d.AVRG_SCORE)) > 0
  );

  useEffect(() => {
    if (!EC) return;

    if (barRef.current && types.length) {
      if (!barChart.current) barChart.current = EC.init(barRef.current);
      barChart.current.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "axis", formatter: (p: unknown) => {
          const arr = p as Array<{ name: string; value: number }>;
          return `${arr[0].name}<br/>경쟁률: <b>${arr[0].value}:1</b>`;
        }},
        xAxis: { type: "category", data: types.map((d) => d.ty), axisLabel: { color: "#94a3b8", fontSize: 11 }, axisLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "value", name: "경쟁률", nameTextStyle: { color: "#94a3b8" }, axisLabel: { color: "#94a3b8", formatter: "{value}:1" }, splitLine: { lineStyle: { color: "#334155" } } },
        series: [{ type: "bar", data: types.map((d) => d.rate), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#10b981" }, { offset: 1, color: "#064e3b" }] } }, label: { show: true, position: "top", color: "#94a3b8", formatter: "{c}:1" } }],
        grid: { left: 60, right: 20, top: 40, bottom: 40 },
      } as EChartsOption, true);
    }

    if (scoreRef.current && scoreByType.length) {
      if (!scoreChart.current) scoreChart.current = EC.init(scoreRef.current);
      scoreChart.current.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        legend: { textStyle: { color: "#94a3b8" }, bottom: 0 },
        xAxis: { type: "category", data: scoreByType.map((d) => d.HOUSE_TY), axisLabel: { color: "#94a3b8", fontSize: 11 }, axisLine: { lineStyle: { color: "#334155" } } },
        yAxis: { type: "value", min: 0, max: 84, name: "가점", nameTextStyle: { color: "#94a3b8" }, axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#334155" } } },
        series: [
          { name: "최고", type: "bar", stack: "s", data: scoreByType.map((d) => [Number(d.TOP_SCORE) - Number(d.AVRG_SCORE), Number(d.AVRG_SCORE)].reduce((a, b) => a + b, 0) - Number(d.AVRG_SCORE)), itemStyle: { color: "#3b82f6" } },
          { name: "평균 이하", type: "bar", stack: "s", data: scoreByType.map((d) => Number(d.AVRG_SCORE) - Number(d.LWET_SCORE)), itemStyle: { color: "#f59e0b" } },
          { name: "최저", type: "bar", stack: "s", data: scoreByType.map((d) => Number(d.LWET_SCORE)), itemStyle: { color: "#334155" } },
          { name: "평균", type: "line", data: scoreByType.map((d) => Number(d.AVRG_SCORE)), itemStyle: { color: "#f59e0b" }, lineStyle: { width: 2 } },
        ],
        grid: { left: 50, right: 20, top: 30, bottom: 50 },
      } as EChartsOption, true);
    }
  }, [cmpetData, scoreData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">경쟁률 분석</h2>
          {source === "api" && <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded">실시간 API</span>}
        </div>
        <select
          value={selected?.HOUSE_MANAGE_NO || ""}
          onChange={(e) => setSelected(houses.find((h) => h.HOUSE_MANAGE_NO === e.target.value) || null)}
          disabled={loadingHouses}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm max-w-xs truncate"
        >
          {loadingHouses && <option>불러오는 중...</option>}
          {houses.map((h) => (
            <option key={h.HOUSE_MANAGE_NO} value={h.HOUSE_MANAGE_NO}>
              [{h.SUBSCRPT_AREA_CODE_NM}] {h.HOUSE_NM}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((i) => <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 h-72 animate-pulse" />)}
        </div>
      ) : (
        <>
          {types.length === 0 && !loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center mb-6">
              <p className="text-slate-400">선택한 단지의 경쟁률 데이터가 아직 집계되지 않았습니다.</p>
              <p className="text-slate-500 text-sm mt-1">청약 접수 완료 후 데이터가 갱신됩니다.</p>
            </div>
          )}

          {types.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {types.map((item, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <p className="text-slate-400 text-xs mb-1">{item.ty}</p>
                    <p className="text-2xl font-bold text-emerald-400">{item.rate.toFixed(2)}:1</p>
                    <p className="text-slate-500 text-xs mt-1">접수 {Number(item.req).toLocaleString()}건 · 공급 {Number(item.suply).toLocaleString()}세대</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <h3 className="text-white font-semibold mb-3">평형별 경쟁률 (1순위)</h3>
                  <div ref={barRef} style={{ height: 260 }} />
                </div>
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <h3 className="text-white font-semibold mb-3">가점 분포 (해당지역)</h3>
                  {scoreByType.length > 0
                    ? <div ref={scoreRef} style={{ height: 260 }} />
                    : <div className="flex items-center justify-center h-64 text-slate-500 text-sm">가점 데이터 없음</div>
                  }
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
