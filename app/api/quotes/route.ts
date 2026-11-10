import { NextResponse } from "next/server";
import { getLiveQuotes } from "@/lib/server/market";

export const runtime = "nodejs";
// Always run on request; freshness is controlled by the in-memory caches in lib/server/market.ts
// (prices 30s, candles 5 min) and the s-maxage=30 header below, so a CDN serves at most 30s-old data.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLiveQuotes();
    if (data.quotes.length === 0) {
      return NextResponse.json({ error: "No live quotes available" }, { status: 503 });
    }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error(`[api/quotes] ${(err as Error).message}`);
    return NextResponse.json({ error: "Live prices are unavailable right now" }, { status: 503 });
  }
}
