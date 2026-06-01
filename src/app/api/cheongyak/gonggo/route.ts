import { NextResponse } from "next/server";
import { mockGonggo } from "@/lib/mockData";

const API_KEY = process.env.ODCLOUD_API_KEY;
const BASE_URL = "https://api.odcloud.kr/api/15098547/v1/uddi:34482d18-bdb0-40da-aebe-e9fe7d843c59";

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
      if (sido) params.set("cond[SIDO::EQ]", sido);

      const res = await fetch(`${BASE_URL}?${params}`);
      const data = await res.json();
      return NextResponse.json({ data: data.data, total: data.totalCount, source: "api" });
    } catch {
      // fall through to mock
    }
  }

  let filtered = mockGonggo;
  if (sido) filtered = filtered.filter((item) => item.SIDO === sido);

  const start = (page - 1) * perPage;
  return NextResponse.json({
    data: filtered.slice(start, start + perPage),
    total: filtered.length,
    source: "mock",
  });
}
