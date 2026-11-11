import { NextResponse, type NextRequest } from "next/server";
import { formatUnits, isAddress } from "viem";
import { z } from "zod";
import { tokenByTicker, type StockTokenConfig } from "@/config/tokens";
import type { TradeQuote, TradeRoute, TradeSide } from "@/lib/market-types";
import { getTradeQuote } from "@/lib/server/lifi";
import { getEthPriceUsd, getLivePrices } from "@/lib/server/market";
import { getDirectQuote } from "@/lib/server/uniswap";
import { getV4Quote } from "@/lib/server/uniswapV4";

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
  /** Slippage tolerance in basis points (0.01% – 10%). */
  slippageBps: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 1 && n <= 1000, "slippage out of range")
    .optional(),
  /** Development only: force one liquidity source to test it. */
  route: z.enum(["uniswap-v4", "uniswap-v3", "lifi"]).optional(),
});

/** A quote is accepted when it loses at most this much value versus live market prices (fees included). */
const MAX_IMPACT_PCT = 3;

type Args = { side: TradeSide; token: StockTokenConfig; usd: number; fromAddress: `0x${string}`; slippageBps: number };
const SOURCES: { route: TradeRoute; get: (a: Args) => Promise<TradeQuote> }[] = [
  { route: "uniswap-v4", get: getV4Quote },
  { route: "uniswap-v3", get: getDirectQuote },
  { route: "lifi", get: getTradeQuote },
];

/** Values both sides at live market prices and fills price impact. */
async function withMarketValue(q: TradeQuote, ticker: string): Promise<TradeQuote> {
  const [ethUsd, prices] = await Promise.all([getEthPriceUsd(), getLivePrices()]);
  const tokenUsd = prices.prices.find((p) => p.ticker === ticker)?.priceUsd;
  if (!tokenUsd) return q;
  const usdOf = (raw: string, t: TradeQuote["fromToken"]) =>
    Number(formatUnits(BigInt(raw), t.decimals)) * (t.symbol === "ETH" ? ethUsd : tokenUsd);
  const inUsd = usdOf(q.fromAmount, q.fromToken);
  const outUsd = usdOf(q.toAmount, q.toToken);
  return { ...q, fromAmountUsd: inUsd, toAmountUsd: outUsd, priceImpactPct: inUsd > 0 ? Math.max(0, (1 - outUsd / inUsd) * 100) : null };
}

export async function GET(req: NextRequest) {
  const parsed = Params.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { side, ticker, usd, from, slippageBps = 50, route } = parsed.data;
  const token = tokenByTicker(ticker);
  if (!token) return NextResponse.json({ error: "Unknown token" }, { status: 400 });
  const args: Args = { side, token, usd, fromAddress: from as `0x${string}`, slippageBps };
  const forced = route && process.env.NODE_ENV !== "production" ? route : null;

  // Order: Uniswap v4 → Uniswap v3 → LI.FI. The first quote within MAX_IMPACT_PCT of market value wins;
  // if none qualifies, the one that keeps the most value is used.
  const tried: TradeQuote[] = [];
  const failures: string[] = [];
  for (const src of SOURCES) {
    if (forced && src.route !== forced) continue;
    try {
      const q = await withMarketValue(await src.get(args), ticker);
      if (q.priceImpactPct === null || q.priceImpactPct <= MAX_IMPACT_PCT) {
        return NextResponse.json(q, { headers: { "Cache-Control": "no-store" } });
      }
      tried.push(q);
      failures.push(`${src.route}: impact ${q.priceImpactPct.toFixed(2)}%`);
    } catch (err) {
      failures.push(`${src.route}: ${(err as Error).message}`);
    }
  }
  if (failures.length && process.env.NODE_ENV !== "production") {
    console.warn(`[api/trade-quote] ${ticker} ${side}: ${failures.join(" | ")}`);
  }
  const best = tried.sort((a, b) => (a.priceImpactPct ?? 100) - (b.priceImpactPct ?? 100))[0];
  if (best) return NextResponse.json(best, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ error: `No route for ${token.ticker} yet`, code: "NO_ROUTE" }, { status: 404 });
}
