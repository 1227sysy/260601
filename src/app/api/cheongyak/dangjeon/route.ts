import { NextResponse } from "next/server";
import { mockDangjeon } from "@/lib/mockData";

const API_KEY = process.env.ODCLOUD_API_KEY;
const BASE_URL = "https://api.odcloud.kr/api/15110812/v1/uddi:bae1a34e-1a3d-4264-bfef-2c8b62193870";

export async function GET() {
  if (API_KEY) {
    try {
      const params = new URLSearchParams({
        serviceKey: API_KEY,
        page: "1",
        perPage: "200",
        returnType: "JSON",
      });

      const res = await fetch(`${BASE_URL}?${params}`);
      const data = await res.json();
      return NextResponse.json({ data: data.data, total: data.totalCount, source: "api" });
    } catch {
      // fall through to mock
    }
  }

  return NextResponse.json({ data: mockDangjeon, total: mockDangjeon.length, source: "mock" });
}
