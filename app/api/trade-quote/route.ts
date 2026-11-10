import { NextResponse, type NextRequest } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { tokenByTicker } from "@/config/tokens";
import { getTradeQuote, RouteUnavailableError } from "@/lib/server/lifi";
import { getDirectQuote, NoDirectRouteError } from "@/lib/server/uniswap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Params = z.object({
  side: z.enum(["buy", "sell"]),
  ticker: z.string().min(1).max(10),
  usd: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "amount must have at most 2 decimals")
    .transform(Number)
    .refine((n) => n > 0 && n <= 100_000, "amount out of range"),
  from: z.string().refine((a) => isAddress(a), "invalid address"),
  /** Development only: force the direct Uniswap v3 route to test the fallback. */
  route: z.enum(["direct"]).optional(),
});

export async function GET(req: NextRequest) {
  const parsed = Params.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { side, ticker, usd, from, route } = parsed.data;
  const token = tokenByTicker(ticker);
  if (!token) return NextResponse.json({ error: "Unknown token" }, { status: 400 });
  const args = { side, token, usd, fromAddress: from as `0x${string}` };
  const forceDirect = route === "direct" && process.env.NODE_ENV !== "production";

  // 1. LI.FI (aggregator). 2. If it has no route or is down, Uniswap v3 through its official contracts.
  let lifiFailure: string | null = null;
  if (!forceDirect) {
    try {
      const quote = await getTradeQuote(args);
      return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
      lifiFailure = err instanceof RouteUnavailableError ? "no route" : (err as Error).message;
    }
  }

  try {
    const quote = await getDirectQuote(args);
    if (lifiFailure) console.warn(`[api/trade-quote] LI.FI ${lifiFailure} for ${ticker}; using direct Uniswap v3`);
    return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof NoDirectRouteError || lifiFailure === "no route") {
      return NextResponse.json({ error: `No route for ${token.ticker} yet`, code: "NO_ROUTE" }, { status: 404 });
    }
    console.error(`[api/trade-quote] lifi: ${lifiFailure ?? "skipped"}; direct: ${(err as Error).message}`);
    return NextResponse.json({ error: "Could not get a quote right now" }, { status: 502 });
  }
}
