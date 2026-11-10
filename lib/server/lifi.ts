import "server-only";
import { parseUnits } from "viem";
import { z } from "zod";
import { CHAIN } from "@/config/chain";
import { NATIVE_ETH, type StockTokenConfig } from "@/config/tokens";
import type { TradeQuote, TradeSide } from "@/lib/market-types";
import { cached, fetchJson } from "./http";

// Verified 2026-11-10:
// - GET https://li.quest/v1/chains lists { id: 4663, key: "out", name: "Robinhood Chain" }
// - GET https://li.quest/v1/token?chain=4663&token=<addr> returns { decimals, priceUSD, ... }
// - GET https://li.quest/v1/quote?fromChain=4663&toChain=4663&... returns a quote with
//   estimate.{fromAmount,toAmount,toAmountMin,approvalAddress,feeCosts,gasCosts} and transactionRequest.

const LIFI = "https://li.quest/v1";

const TokenInfo = z.object({
  address: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  priceUSD: z.string(),
});

async function tokenInfo(address: string) {
  return cached(`lifi-token:${address}`, 30_000, () =>
    fetchJson(`${LIFI}/token?chain=${CHAIN.id}&token=${address}`, TokenInfo, { label: "lifi token", timeoutMs: 8000 }),
  );
}

const Cost = z.object({ amountUSD: z.string().optional(), included: z.boolean().optional() }).passthrough();
const QuoteToken = z.object({ address: z.string(), symbol: z.string(), decimals: z.number() });
const Quote = z.object({
  tool: z.string(),
  toolDetails: z.object({ name: z.string() }).optional(),
  action: z.object({ fromToken: QuoteToken, toToken: QuoteToken }),
  estimate: z.object({
    fromAmount: z.string(),
    toAmount: z.string(),
    toAmountMin: z.string(),
    fromAmountUSD: z.string().optional(),
    toAmountUSD: z.string().optional(),
    approvalAddress: z.string().optional(),
    feeCosts: z.array(Cost).optional(),
    gasCosts: z.array(Cost).optional(),
  }),
  transactionRequest: z.object({
    to: z.string(),
    data: z.string(),
    value: z.string(),
    gasLimit: z.string().optional(),
    chainId: z.number(),
  }),
});

export class RouteUnavailableError extends Error {}

const sumUsd = (costs?: z.infer<typeof Cost>[]) =>
  (costs ?? []).reduce((s, c) => s + (Number(c.amountUSD) || 0), 0);

const hexToDec = (v: string) => (v.startsWith("0x") ? BigInt(v).toString() : v);

export async function getTradeQuote({
  side,
  token,
  usd,
  fromAddress,
}: {
  side: TradeSide;
  token: StockTokenConfig;
  usd: number;
  fromAddress: `0x${string}`;
}): Promise<TradeQuote> {
  const fromTokenAddr = side === "buy" ? NATIVE_ETH : token.address;
  const toTokenAddr = side === "buy" ? token.address : NATIVE_ETH;

  // Size the input from a live USD price for the token being spent.
  const spend = await tokenInfo(fromTokenAddr);
  const price = Number(spend.priceUSD);
  if (!Number.isFinite(price) || price <= 0) throw new RouteUnavailableError("No live price for the input token");
  const units = (usd / price).toFixed(Math.min(spend.decimals, 12));
  const fromAmount = parseUnits(units, spend.decimals).toString();

  const params = new URLSearchParams({
    fromChain: String(CHAIN.id),
    toChain: String(CHAIN.id),
    fromToken: fromTokenAddr,
    toToken: toTokenAddr,
    fromAmount,
    fromAddress,
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(`${LIFI}/quote?${params}`, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { accept: "application/json", "user-agent": "reuno-site/1.0" },
    });
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 404 || res.status === 400 || res.status === 422) {
    throw new RouteUnavailableError("Route not available yet");
  }
  if (!res.ok) throw new Error(`lifi quote: HTTP ${res.status}`);
  const parsed = Quote.safeParse(await res.json());
  if (!parsed.success) throw new Error(`lifi quote: unexpected response shape — ${parsed.error.issues[0]?.message}`);
  const q = parsed.data;
  if (q.transactionRequest.chainId !== CHAIN.id) throw new RouteUnavailableError("Route not available yet");

  return {
    side,
    tool: q.toolDetails?.name ?? q.tool,
    fromToken: { ...q.action.fromToken, address: q.action.fromToken.address as `0x${string}` },
    toToken: { ...q.action.toToken, address: q.action.toToken.address as `0x${string}` },
    fromAmount: q.estimate.fromAmount,
    toAmount: q.estimate.toAmount,
    toAmountMin: q.estimate.toAmountMin,
    fromAmountUsd: q.estimate.fromAmountUSD ? Number(q.estimate.fromAmountUSD) : null,
    toAmountUsd: q.estimate.toAmountUSD ? Number(q.estimate.toAmountUSD) : null,
    feesUsd: sumUsd(q.estimate.feeCosts),
    gasUsd: sumUsd(q.estimate.gasCosts),
    approvalAddress: (q.estimate.approvalAddress as `0x${string}` | undefined) ?? null,
    transactionRequest: {
      to: q.transactionRequest.to as `0x${string}`,
      data: q.transactionRequest.data as `0x${string}`,
      value: hexToDec(q.transactionRequest.value),
      gasLimit: q.transactionRequest.gasLimit ? hexToDec(q.transactionRequest.gasLimit) : null,
      chainId: q.transactionRequest.chainId,
    },
    fetchedAt: new Date().toISOString(),
  };
}
