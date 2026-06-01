import { NextResponse } from "next/server";
import { mockGyeongjaengnyul } from "@/lib/mockData";
import { API_BASES } from "@/lib/apiConstants";

const GONGGO_KEY = process.env.ODCLOUD_API_KEY_GONGGO;
const API_KEY = process.env.ODCLOUD_API_KEY_GYEONGJAENGNYUL;

async function odFetch(base: string, endpoint: string, params: Record<string, string>) {
  const p = new URLSearchParams(params);
  const res = await fetch(`${base}/${endpoint}?${p}`, { next: { revalidate: 1800 } });
  const data = await res.json();
  return data?.data ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const houseManageNo = searchParams.get("houseManageNo");
  const type = searchParams.get("type") || "cmpet";

  // 당첨자 발표 완료된 단지 목록 반환 (드롭다운용)
  if (type === "list") {
    if (GONGGO_KEY) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const data = await odFetch(API_BASES.gonggo, "getAPTLttotPblancDetail", {
          serviceKey: GONGGO_KEY,
          page: "1",
          perPage: "30",
          returnType: "JSON",
          [`cond[PRZWNER_PRESNATN_DE::LTE]`]: today,
        });
        if (data?.length) {
          return NextResponse.json({
            data: data.map((d: Record<string, string>) => ({
              HOUSE_MANAGE_NO: d.HOUSE_MANAGE_NO,
              HOUSE_NM: d.HOUSE_NM,
              SUBSCRPT_AREA_CODE_NM: d.SUBSCRPT_AREA_CODE_NM,
            })),
            source: "api",
          });
        }
      } catch (e) {
        console.error("house list error:", e);
      }
    }
    // mock fallback
    const mockList = [...new Set(mockGyeongjaengnyul.map((d) => d.HOUSE_NM))].map((name, i) => ({
      HOUSE_MANAGE_NO: `MOCK${String(i).padStart(4, "0")}`,
      HOUSE_NM: name,
      SUBSCRPT_AREA_CODE_NM: mockGyeongjaengnyul.find((d) => d.HOUSE_NM === name)?.SIDO ?? "",
    }));
    return NextResponse.json({ data: mockList, source: "mock" });
  }

  // 경쟁률 데이터
  if (type === "cmpet" && houseManageNo) {
    if (API_KEY) {
      try {
        const data = await odFetch(API_BASES.gyeongjaengnyul, "getAPTLttotPblancCmpet", {
          serviceKey: API_KEY,
          page: "1",
          perPage: "100",
          returnType: "JSON",
          [`cond[HOUSE_MANAGE_NO::EQ]`]: houseManageNo,
          [`cond[SUBSCRPT_RANK_CODE::EQ]`]: "1",
        });
        if (data !== null) {
          return NextResponse.json({ data, source: "api" });
        }
      } catch (e) {
        console.error("cmpet error:", e);
      }
    }
  }

  // 가점 데이터
  if (type === "score" && houseManageNo) {
    if (API_KEY) {
      try {
        const data = await odFetch(API_BASES.gyeongjaengnyul, "getAptLttotPblancScore", {
          serviceKey: API_KEY,
          page: "1",
          perPage: "100",
          returnType: "JSON",
          [`cond[HOUSE_MANAGE_NO::EQ]`]: houseManageNo,
        });
        if (data !== null) {
          return NextResponse.json({ data, source: "api" });
        }
      } catch (e) {
        console.error("score error:", e);
      }
    }
  }

  // 특별공급 현황
  if (type === "spsply" && houseManageNo) {
    if (API_KEY) {
      try {
        const data = await odFetch(API_BASES.gyeongjaengnyul, "getAPTSpsplyReqstStus", {
          serviceKey: API_KEY,
          page: "1",
          perPage: "100",
          returnType: "JSON",
          [`cond[HOUSE_MANAGE_NO::EQ]`]: houseManageNo,
        });
        if (data !== null) {
          return NextResponse.json({ data, source: "api" });
        }
      } catch (e) {
        console.error("spsply error:", e);
      }
    }
  }

  // mock fallback
  return NextResponse.json({ data: mockGyeongjaengnyul, total: mockGyeongjaengnyul.length, source: "mock" });
}
