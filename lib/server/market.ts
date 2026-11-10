import "server-only";
import { z } from "zod";
import { CHAIN } from "@/config/chain";
import { FEATURED_TICKERS, STOCK_TOKENS, type StockTokenConfig } from "@/config/tokens";
import type { LivePrice, LiveQuote } from "@/lib/market-types";
import { cached, fetchJson, lastGood } from "./http";

/* ---------------- DexScreener ---------------- */
// Verified 2026-11-10: GET https://api.dexscreener.com/tokens/v1/robinhood/{addresses}
// returns an array of pairs with priceUsd, priceChange.h24, liquidity.usd, pairAddress, url.

const DexPair = z.object({
  chainId: z.string(),
  dexId: z.string(),
  url: z.string().url(),
  pairAddress: z.string(),
  baseToken: z.object({ address: z.string(), symbol: z.string(), name: z.string() }),
  quoteToken: z.object({ address: z.string(), symbol: z.string() }),
  priceUsd: z.string().optional(),
  priceChange: z.object({ h24: z.number().optional() }).partial().optional(),
  liquidity: z.object({ usd: z.number().optional() }).partial().optional(),
});
type DexPair = z.infer<typeof DexPair>;
const DexResponse = z.array(DexPair);

async function dexPairs(addresses: string[]): Promise<DexPair[]> {
  // DexScreener accepts up to 30 addresses per call.
  const chunks: string[][] = [];
  for (let i = 0; i < addresses.length; i += 30) chunks.push(addresses.slice(i, i + 30));
  const results = await Promise.all(
    chunks.map((c) =>
      fetchJson(`https://api.dexscreener.com/tokens/v1/${CHAIN.dexscreenerId}/${c.join(",")}`, DexResponse, {
        label: "dexscreener",
      }),
    ),
  );
  return results.flat().filter((p) => p.chainId === CHAIN.dexscreenerId);
}

/** Highest-liquidity pair where the token is the base token. */
function bestPair(pairs: DexPair[], token: StockTokenConfig): DexPair | undefined {
  return pairs
    .filter((p) => p.baseToken.address.toLowerCase() === token.address.toLowerCase())
    .filter((p) => p.priceUsd && Number.isFinite(Number(p.priceUsd)) && Number(p.priceUsd) > 0)
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
}

/** Live price for every configured stock token. Tokens without a live pool are left out. */
export async function getLivePrices(): Promise<{ prices: LivePrice[]; updatedAt: string }> {
  return cached("prices", 30_000, async () => {
    const pairs = await dexPairs(STOCK_TOKENS.map((t) => t.address));
    const prices: LivePrice[] = [];
    for (const token of STOCK_TOKENS) {
      const pair = bestPair(pairs, token);
      if (!pair) {
        console.warn(`[market] no live pool for ${token.ticker} (${token.address})`);
        continue;
      }
      prices.push({
        ticker: token.ticker,
        name: token.name,
        kind: token.kind,
        address: token.address,
        priceUsd: Number(pair.priceUsd),
        changePct24h: pair.priceChange?.h24 ?? 0,
        liquidityUsd: pair.liquidity?.usd ?? 0,
        pairAddress: pair.pairAddress,
        poolUrl: pair.url,
      });
    }
    recordSnapshots(prices);
    return { prices, updatedAt: new Date().toISOString() };
  });
}

/* ---------------- GeckoTerminal candles ---------------- */
// Verified 2026-11-10: network id "robinhood";
// GET /api/v2/networks/robinhood/pools/{pool}/ohlcv/hour?aggregate=1&limit=24&currency=usd
// returns data.attributes.ohlcv_list = [[unix, o, h, l, c, v], ...] newest first,
// and meta.base.address = the base token. Free tier is ~30 calls/min, so candles are cached 5 min.

const Ohlcv = z.object({
  data: z.object({
    attributes: z.object({ ohlcv_list: z.array(z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()])) }),
  }),
  meta: z.object({ base: z.object({ address: z.string() }) }).optional(),
});

type Series = { closes: number[]; times: number[] };

/** After a 429 we stop calling GeckoTerminal for a minute and serve the last good series. */
let geckoCooldownUntil = 0;

async function candles(pairAddress: string, baseAddress: string): Promise<Series> {
  const key = `ohlcv:${pairAddress}`;
  if (Date.now() < geckoCooldownUntil) {
    const stale = lastGood<Series>(key);
    if (stale) return stale;
    throw new Error("geckoterminal: cooling down after rate limit");
  }
  try {
    return await loadCandles(key, pairAddress, baseAddress);
  } catch (err) {
    if ((err as Error).message.includes("HTTP 429")) geckoCooldownUntil = Date.now() + 60_000;
    const stale = lastGood<Series>(key);
    if (stale) return stale;
    throw err;
  }
}

async function loadCandles(key: string, pairAddress: string, baseAddress: string): Promise<Series> {
  return cached(key, 5 * 60_000, async () => {
    const url = `https://api.geckoterminal.com/api/v2/networks/${CHAIN.geckoterminalId}/pools/${pairAddress.toLowerCase()}/ohlcv/hour?aggregate=1&limit=24&currency=usd`;
    const res = await fetchJson(url, Ohlcv, { label: "geckoterminal" });
    const base = res.meta?.base.address.toLowerCase();
    if (base && base !== baseAddress.toLowerCase()) {
      throw new Error(`geckoterminal: pool ${pairAddress} base token mismatch`);
    }
    const list = [...res.data.attributes.ohlcv_list].sort((a, b) => a[0] - b[0]);
    return { closes: list.map((c) => c[4]), times: list.map((c) => c[0]) };
  });
}

/* ---------------- Snapshot fallback (real prices only) ---------------- */
// If candles are unavailable, the chart is built from DexScreener prices this server
// has actually seen, one point per 5 minutes, last 24h only. It starts short and fills up.

const snapshots = new Map<string, { t: number; p: number }[]>();

function recordSnapshots(prices: LivePrice[]) {
  const now = Math.floor(Date.now() / 1000);
  for (const q of prices) {
    const list = snapshots.get(q.ticker) ?? [];
    const last = list.at(-1);
    if (!last || now - last.t >= 300) list.push({ t: now, p: q.priceUsd });
    while (list.length && now - list[0].t > 24 * 3600) list.shift();
    snapshots.set(q.ticker, list);
  }
}

/* ---------------- Featured quotes for the /stocks hero ---------------- */

export async function getLiveQuotes(): Promise<{ quotes: LiveQuote[]; updatedAt: string }> {
  const { prices, updatedAt } = await getLivePrices();
  const featured = prices
    .filter((p) => (FEATURED_TICKERS as readonly string[]).includes(p.ticker))
    .sort((a, b) => b.liquidityUsd - a.liquidityUsd)
    .slice(0, 5);

  // Sequential on purpose: GeckoTerminal's free tier rejects bursts.
  const quotes: LiveQuote[] = [];
  for (const p of featured) {
    quotes.push(await withSeries(p, updatedAt));
  }
  return { quotes, updatedAt };
}

async function withSeries(p: LivePrice, updatedAt: string): Promise<LiveQuote> {
  try {
    const s = await candles(p.pairAddress, p.address);
    // Append the live price as the newest point so the end dot matches the displayed price.
    const closes = [...s.closes, p.priceUsd];
    const times = [...s.times, Math.floor(Date.parse(updatedAt) / 1000)];
    return { ...p, series: closes, seriesTimes: times, updatedAt, source: "dexscreener+geckoterminal" };
  } catch (err) {
    console.warn(`[market] candles unavailable for ${p.ticker}: ${(err as Error).message}`);
    const snap = snapshots.get(p.ticker) ?? [];
    return {
      ...p,
      series: snap.map((x) => x.p),
      seriesTimes: snap.map((x) => x.t),
      updatedAt,
      source: "dexscreener",
    };
  }
}
