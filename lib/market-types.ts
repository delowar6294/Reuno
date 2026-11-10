import type { TokenKind } from "@/config/tokens";

/** Live price for one stock token, from its highest-liquidity DexScreener pool. */
export type LivePrice = {
  ticker: string;
  name: string;
  kind: TokenKind;
  address: `0x${string}`;
  priceUsd: number;
  changePct24h: number;
  liquidityUsd: number;
  pairAddress: string;
  poolUrl: string;
};

/** Featured quote with a 24h hourly close series (oldest → newest). */
export type LiveQuote = LivePrice & {
  series: number[];
  /** Unix seconds for each point in `series`. */
  seriesTimes: number[];
  updatedAt: string;
  source: "dexscreener+geckoterminal" | "dexscreener";
};

export type QuotesResponse = { quotes: LiveQuote[]; updatedAt: string };
export type PricesResponse = {
  prices: LivePrice[];
  /** Live ETH price from the deepest WETH pool on Robinhood Chain, or null if unavailable. */
  ethUsd: number | null;
  updatedAt: string;
};

export type TradeSide = "buy" | "sell";

export type TradeRoute = "lifi" | "uniswap-v3";

export type TradeQuote = {
  side: TradeSide;
  /** Which router built the transaction. */
  route: TradeRoute;
  tool: string;
  /** Slippage tolerance applied to toAmountMin, in basis points. */
  slippageBps: number;
  fromToken: { address: `0x${string}`; symbol: string; decimals: number };
  toToken: { address: `0x${string}`; symbol: string; decimals: number };
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  fromAmountUsd: number | null;
  toAmountUsd: number | null;
  feesUsd: number;
  /** Router's own gas estimate in USD, when it provides one. The wallet preflight estimates gas again on-chain. */
  gasUsd: number | null;
  approvalAddress: `0x${string}` | null;
  transactionRequest: {
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
    gasLimit: string | null;
    chainId: number;
  };
  fetchedAt: string;
};

/** Source chains we offer for bridging gas into Robinhood Chain (each verified to route via LI.FI). */
export type BridgeQuote = {
  tool: string;
  fromChainId: number;
  fromToken: { address: `0x${string}`; symbol: string; decimals: number };
  toToken: { address: `0x${string}`; symbol: string; decimals: number };
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  fromAmountUsd: number | null;
  toAmountUsd: number | null;
  feesUsd: number;
  gasUsd: number | null;
  durationSec: number | null;
  approvalAddress: `0x${string}` | null;
  transactionRequest: {
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
    gasLimit: string | null;
    chainId: number;
  };
  fetchedAt: string;
};

export type BridgeStatus = {
  status: "NOT_FOUND" | "INVALID" | "PENDING" | "DONE" | "FAILED";
  substatus: string | null;
  substatusMessage: string | null;
  receivingTxHash: string | null;
  receivingTxLink: string | null;
  toAmount: string | null;
};
