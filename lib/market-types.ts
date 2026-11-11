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

/** Internal only: which liquidity source built the transaction. Never shown in the UI. */
export type TradeRoute = "uniswap-v4" | "uniswap-v3" | "lifi";

type Addr = `0x${string}`;

export type V4PoolKey = { currency0: Addr; currency1: Addr; fee: number; tickSpacing: number; hooks: Addr };
export type V4PathKey = { intermediateCurrency: Addr; fee: number; tickSpacing: number; hooks: Addr; hookData: `0x${string}` };

/** Serializable v4 swap plan (amounts as decimal strings) so the server can re-encode it with a Permit2 signature. */
export type V4Plan = (
  | { kind: "single"; poolKey: V4PoolKey; zeroForOne: boolean }
  | { kind: "path"; currencyIn: Addr; path: V4PathKey[] }
) & { amountIn: string; amountOutMin: string; deadline: number };

/** EIP-712 PermitSingle for Permit2 (values as decimal strings). */
export type PermitRequest = {
  domain: { name: "Permit2"; chainId: number; verifyingContract: Addr };
  values: {
    details: { token: Addr; amount: string; expiration: string; nonce: string };
    spender: Addr;
    sigDeadline: string;
  };
};

export type TradeQuote = {
  side: TradeSide;
  /** Internal: which liquidity source built the transaction (logged in development only). */
  route: TradeRoute;
  /** Internal description of the route (logged in development only). */
  tool: string;
  /** Slippage tolerance applied to toAmountMin, in basis points. */
  slippageBps: number;
  fromToken: { address: `0x${string}`; symbol: string; decimals: number };
  toToken: { address: `0x${string}`; symbol: string; decimals: number };
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  /** Market value of each side at live prices (DexScreener), filled by the quote route. */
  fromAmountUsd: number | null;
  toAmountUsd: number | null;
  /** (value in − value out) / value in at live market prices, in percent; includes pool fees. */
  priceImpactPct: number | null;
  feesUsd: number;
  /** Router's own gas estimate in USD, when it provides one. The wallet preflight estimates gas again on-chain. */
  gasUsd: number | null;
  approvalAddress: `0x${string}` | null;
  /** Null while a Permit2 signature is still needed (v4 sells); built by /api/trade-build after signing. */
  transactionRequest: {
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
    gasLimit: string | null;
    chainId: number;
  } | null;
  /** Permit2 signature request (v4 sells without a live Permit2 allowance). */
  permit?: PermitRequest | null;
  v4Plan?: V4Plan;
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
