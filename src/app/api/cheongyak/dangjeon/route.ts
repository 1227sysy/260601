import { NextResponse } from "next/server";
import { mockDangjeon } from "@/lib/mockData";
import { API_BASES, AREA_CODE_MAP, AREA_CODE_TO_FULL } from "@/lib/apiConstants";

const API_KEY = process.env.ODCLOUD_API_KEY_STAT;

// 최근 12개월 YYYYMM 범위 반환
function getStatDateRange() {
  const now = new Date();
  const end = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const start = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, "0")}`;
  return { start, end };
}

async function fetchStat(endpoint: string, extraParams: Record<string, string> = {}) {
  if (!API_KEY) return null;
  const { start, end } = getStatDateRange();
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    page: "1",
    perPage: "200",
    returnType: "JSON",
    "cond[STAT_DE::GTE]": start,
    "cond[STAT_DE::LTE]": end,
    ...extraParams,
  });
  const res = await fetch(`${API_BASES.stat}/${endpoint}?${params}`, { next: { revalidate: 3600 } });
  const data = await res.json();
  return data?.data ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "area"; // area | age | cmpet | score

  if (API_KEY) {
    try {
      let result = null;

      if (type === "area") {
        // 지역별 당첨자 — 전 지역 수집
        const allData: unknown[] = [];
        for (const [, code] of Object.entries(AREA_CODE_MAP)) {
          const rows = await fetchStat("getAPTPrzwnerAreaStat", {
            "cond[SUBSCRPT_AREA_CODE::EQ]": code,
          });
          if (rows) allData.push(...rows);
        }
        result = allData;
      } else if (type === "age") {
        result = await fetchStat("getAPTPrzwnerAgeStat");
      } else if (type === "reqst_age") {
        result = await fetchStat("getAPTReqstAgeStat");
      } else if (type === "cmpet") {
        const allData: unknown[] = [];
        for (const [, code] of Object.entries(AREA_CODE_MAP)) {
          const rows = await fetchStat("getAPTCmpetrtAreaStat", {
            "cond[SUBSCRPT_AREA_CODE::EQ]": code,
          });
          if (rows) allData.push(...rows);
        }
        result = allData;
      } else if (type === "score") {
        const allData: unknown[] = [];
        for (const [, code] of Object.entries(AREA_CODE_MAP)) {
          const rows = await fetchStat("getAPTApsPrzwnerStat", {
            "cond[SUBSCRPT_AREA_CODE::EQ]": code,
          });
          if (rows) allData.push(...rows);
        }
        result = allData;
      }

      if (result) {
        return NextResponse.json({ data: result, source: "api" });
      }
    } catch (e) {
      console.error("당첨자 통계 API 오류:", e);
    }
  }

  // mock fallback — 지역명 정규화
  const normalized = mockDangjeon.map((d) => ({
    SUBSCRPT_AREA_CODE_NM: AREA_CODE_TO_FULL[
      Object.entries(AREA_CODE_MAP).find(([, v]) => AREA_CODE_TO_FULL[v] === d.SIDO)?.[1] ?? ""
    ] ?? d.SIDO,
    AGE_30: d.APPLY_CNT * 0.3,
    AGE_40: d.APPLY_CNT * 0.35,
    AGE_50: d.APPLY_CNT * 0.2,
    AGE_60: d.APPLY_CNT * 0.15,
    WIN_30: d.WIN_CNT * 0.25,
    WIN_40: d.WIN_CNT * 0.4,
    WIN_50: d.WIN_CNT * 0.25,
    WIN_60: d.WIN_CNT * 0.1,
    SIDO: d.SIDO,
    WIN_CNT: d.WIN_CNT,
    APPLY_CNT: d.APPLY_CNT,
  }));

  return NextResponse.json({ data: normalized, source: "mock" });
}
