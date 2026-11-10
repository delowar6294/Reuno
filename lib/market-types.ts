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
export type PricesResponse = { prices: LivePrice[]; updatedAt: string };

export type TradeSide = "buy" | "sell";

export type TradeQuote = {
  side: TradeSide;
  tool: string;
  fromToken: { address: `0x${string}`; symbol: string; decimals: number };
  toToken: { address: `0x${string}`; symbol: string; decimals: number };
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  fromAmountUsd: number | null;
  toAmountUsd: number | null;
  feesUsd: number;
  gasUsd: number;
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
