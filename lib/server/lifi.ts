import "server-only";
import { parseUnits } from "viem";
import { z } from "zod";
import { CHAIN } from "@/config/chain";
import { NATIVE_ETH, type StockTokenConfig } from "@/config/tokens";
import type { BridgeQuote, BridgeStatus, TradeQuote, TradeSide } from "@/lib/market-types";
import { onchainDecimals } from "./chain";
import { cached, fetchJson } from "./http";

// Verified 2026-11-10:
// - GET https://li.quest/v1/chains lists { id: 4663, key: "out", name: "Robinhood Chain" }
// - GET https://li.quest/v1/token?chain=4663&token=<addr> returns { decimals, priceUSD, ... }
// - GET https://li.quest/v1/quote?fromChain=4663&toChain=4663&... returns a quote with
//   estimate.{fromAmount,toAmount,toAmountMin,approvalAddress,feeCosts,gasCosts} and transactionRequest.

const LIFI = "https://li.quest/v1";
const SLIPPAGE_BPS = 50; // 0.5%, sent explicitly instead of relying on LI.FI's default

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
  action: z.object({ fromChainId: z.number(), toChainId: z.number(), fromToken: QuoteToken, toToken: QuoteToken }),
  estimate: z.object({
    executionDuration: z.number().optional(),
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

async function fetchLifiQuote(params: URLSearchParams) {
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
  return parsed.data;
}

const sumUsd = (costs?: z.infer<typeof Cost>[]) =>
  (costs ?? []).reduce((s, c) => s + (Number(c.amountUSD) || 0), 0);

const hexToDec = (v: string) => (v.startsWith("0x") ? BigInt(v).toString() : v);

export async function getTradeQuote({
  side,
  token,
  usd,
  fromAddress,
  slippageBps = SLIPPAGE_BPS,
}: {
  side: TradeSide;
  token: StockTokenConfig;
  usd: number;
  fromAddress: `0x${string}`;
  slippageBps?: number;
}): Promise<TradeQuote> {
  const fromTokenAddr = side === "buy" ? NATIVE_ETH : token.address;
  const toTokenAddr = side === "buy" ? token.address : NATIVE_ETH;

  // Size the input from a live USD price for the token being spent; decimals come from the contract itself.
  const [spend, decimals] = await Promise.all([tokenInfo(fromTokenAddr), onchainDecimals(fromTokenAddr)]);
  const price = Number(spend.priceUSD);
  if (!Number.isFinite(price) || price <= 0) throw new RouteUnavailableError("No live price for the input token");
  const units = (usd / price).toFixed(Math.min(decimals, 12));
  const fromAmount = parseUnits(units, decimals).toString();
  if (fromAmount === "0") throw new RouteUnavailableError("Amount is below the token's smallest unit");

  const params = new URLSearchParams({
    fromChain: String(CHAIN.id),
    toChain: String(CHAIN.id),
    fromToken: fromTokenAddr,
    toToken: toTokenAddr,
    fromAmount,
    fromAddress,
    slippage: String(slippageBps / 10_000),
  });

  const q = await fetchLifiQuote(params);
  if (q.transactionRequest.chainId !== CHAIN.id) throw new RouteUnavailableError("Route not available yet");

  return {
    side,
    route: "lifi",
    tool: q.toolDetails?.name ?? q.tool,
    slippageBps,
    fromToken: { ...q.action.fromToken, address: q.action.fromToken.address as `0x${string}` },
    toToken: { ...q.action.toToken, address: q.action.toToken.address as `0x${string}` },
    fromAmount: q.estimate.fromAmount,
    toAmount: q.estimate.toAmount,
    toAmountMin: q.estimate.toAmountMin,
    fromAmountUsd: q.estimate.fromAmountUSD ? Number(q.estimate.fromAmountUSD) : null,
    toAmountUsd: q.estimate.toAmountUSD ? Number(q.estimate.toAmountUSD) : null,
    priceImpactPct: null,
    feesUsd: sumUsd(q.estimate.feeCosts),
    gasUsd: q.estimate.gasCosts?.length ? sumUsd(q.estimate.gasCosts) : null,
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

/* ---------------- Bridge gas into Robinhood Chain ---------------- */

/** Native gas token on the source chain → native ETH on Robinhood Chain, signed by the user on the source chain. */
export async function getBridgeQuote({
  fromChain,
  usd,
  fromAddress,
}: {
  fromChain: number;
  usd: number;
  fromAddress: `0x${string}`;
}): Promise<BridgeQuote> {
  const info = await cached(`lifi-token:${fromChain}:native`, 30_000, () =>
    fetchJson(`${LIFI}/token?chain=${fromChain}&token=${NATIVE_ETH}`, TokenInfo, { label: "lifi token", timeoutMs: 8000 }),
  );
  const price = Number(info.priceUSD);
  if (!Number.isFinite(price) || price <= 0) throw new RouteUnavailableError("No live price for the source token");
  const fromAmount = parseUnits((usd / price).toFixed(Math.min(info.decimals, 12)), info.decimals).toString();

  const params = new URLSearchParams({
    fromChain: String(fromChain),
    toChain: String(CHAIN.id),
    fromToken: NATIVE_ETH,
    toToken: NATIVE_ETH,
    fromAmount,
    fromAddress,
    toAddress: fromAddress,
    slippage: String(SLIPPAGE_BPS / 10_000),
  });
  const q = await fetchLifiQuote(params);
  if (q.transactionRequest.chainId !== fromChain || q.action.toChainId !== CHAIN.id) {
    throw new RouteUnavailableError("Route not available yet");
  }
  return {
    tool: q.toolDetails?.name ?? q.tool,
    fromChainId: fromChain,
    fromToken: { ...q.action.fromToken, address: q.action.fromToken.address as `0x${string}` },
    toToken: { ...q.action.toToken, address: q.action.toToken.address as `0x${string}` },
    fromAmount: q.estimate.fromAmount,
    toAmount: q.estimate.toAmount,
    toAmountMin: q.estimate.toAmountMin,
    fromAmountUsd: q.estimate.fromAmountUSD ? Number(q.estimate.fromAmountUSD) : null,
    toAmountUsd: q.estimate.toAmountUSD ? Number(q.estimate.toAmountUSD) : null,
    feesUsd: sumUsd(q.estimate.feeCosts),
    gasUsd: q.estimate.gasCosts?.length ? sumUsd(q.estimate.gasCosts) : null,
    durationSec: q.estimate.executionDuration ?? null,
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

// Verified 2026-11-11: GET https://li.quest/v1/status?txHash=... returns { status, substatus, substatusMessage, receiving: { txHash, txLink, amount } }.
const StatusResponse = z
  .object({
    status: z.enum(["NOT_FOUND", "INVALID", "PENDING", "DONE", "FAILED"]),
    substatus: z.string().optional(),
    substatusMessage: z.string().optional(),
    sending: z
      .object({ txHash: z.string().optional(), chainId: z.number().optional() })
      .passthrough()
      .optional(),
    receiving: z
      .object({ txHash: z.string().optional(), txLink: z.string().optional(), amount: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

export async function getBridgeStatus({
  txHash,
  fromChain,
  bridge,
}: {
  txHash: string;
  fromChain: number;
  bridge?: string;
}): Promise<BridgeStatus> {
  const params = new URLSearchParams({ txHash, fromChain: String(fromChain), toChain: String(CHAIN.id) });
  if (bridge) params.set("bridge", bridge);
  const s = await fetchJson(`${LIFI}/status?${params}`, StatusResponse, { label: "lifi status", timeoutMs: 10_000 });
  // Seen 2026-11-11: for a hash LI.FI has not indexed, /status can answer with an unrelated transfer.
  // Only trust the answer when the sending tx is ours, on the chain we sent from.
  const ours =
    s.sending?.txHash?.toLowerCase() === txHash.toLowerCase() &&
    (s.sending?.chainId === undefined || s.sending.chainId === fromChain);
  if (!ours) {
    return { status: "NOT_FOUND", substatus: null, substatusMessage: null, receivingTxHash: null, receivingTxLink: null, toAmount: null };
  }
  return {
    status: s.status,
    substatus: s.substatus ?? null,
    substatusMessage: s.substatusMessage ?? null,
    receivingTxHash: s.receiving?.txHash ?? null,
    receivingTxLink: s.receiving?.txLink ?? null,
    toAmount: s.receiving?.amount ?? null,
  };
}
