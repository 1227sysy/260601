import { NextResponse } from "next/server";
import { mockGonggo } from "@/lib/mockData";
import { API_BASES } from "@/lib/apiConstants";

const API_KEY = process.env.ODCLOUD_API_KEY_GONGGO;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sido = searchParams.get("sido");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "20");

  if (API_KEY) {
    try {
      const params = new URLSearchParams({
        serviceKey: API_KEY,
        page: page.toString(),
        perPage: perPage.toString(),
        returnType: "JSON",
      });
      if (sido) params.set("cond[SUBSCRPT_AREA_CODE_NM::EQ]", sido);

      const url = `${API_BASES.gonggo}/getAPTLttotPblancDetail?${params}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      const data = await res.json();

      if (data?.data) {
        return NextResponse.json({
          data: data.data,
          total: data.totalCount,
          source: "api",
        });
      }
    } catch (e) {
      console.error("분양정보 API 오류:", e);
    }
  }

  let filtered = mockGonggo;
  if (sido) filtered = filtered.filter((item) => item.SIDO === sido || item.SUBSCRPT_AREA_CODE_NM === sido);
  const start = (page - 1) * perPage;
  return NextResponse.json({
    data: filtered.slice(start, start + perPage),
    total: filtered.length,
    source: "mock",
  });
}
