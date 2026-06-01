import { NextResponse } from "next/server";
import { mockGyeongjaengnyul } from "@/lib/mockData";

const API_KEY = process.env.ODCLOUD_API_KEY;
const BASE_URL = "https://api.odcloud.kr/api/15098905/v1/uddi:82e2af5a-e243-49b9-a46e-ca01f2f7f1e2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const houseName = searchParams.get("houseName");

  if (API_KEY) {
    try {
      const params = new URLSearchParams({
        serviceKey: API_KEY,
        page: "1",
        perPage: "100",
        returnType: "JSON",
      });
      if (houseName) params.set("cond[HOUSE_NM::LIKE]", houseName);

      const res = await fetch(`${BASE_URL}?${params}`);
      const data = await res.json();
      return NextResponse.json({ data: data.data, total: data.totalCount, source: "api" });
    } catch {
      // fall through to mock
    }
  }

  let filtered = mockGyeongjaengnyul;
  if (houseName) {
    filtered = filtered.filter((item) =>
      item.HOUSE_NM.toLowerCase().includes(houseName.toLowerCase())
    );
  }

  return NextResponse.json({ data: filtered, total: filtered.length, source: "mock" });
}
