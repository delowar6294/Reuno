import "server-only";
import { encodeFunctionData, formatUnits, parseAbi, parseUnits } from "viem";
import { CHAIN } from "@/config/chain";
import { DIRECT_DEADLINE_SEC, DIRECT_SLIPPAGE_BPS, UNISWAP_V3, UNISWAP_V3_FEES } from "@/config/dex";
import { WETH_ADDRESS, type StockTokenConfig } from "@/config/tokens";
import type { TradeQuote, TradeSide } from "@/lib/market-types";
import { onchainDecimals, rhPublicClient } from "./chain";
import { getEthPriceUsd, getLivePrices } from "./market";

const quoterAbi = parseAbi([
  "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)",
]);

const routerAbi = parseAbi([
  "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
  "function unwrapWETH9(uint256 amountMinimum, address recipient) payable",
  "function multicall(uint256 deadline, bytes[] data) payable returns (bytes[] results)",
]);

/** SwapRouter02 constant: the router itself holds the output (used before unwrapping WETH). */
const ADDRESS_THIS = "0x0000000000000000000000000000000000000002";

export class NoDirectRouteError extends Error {}

/** Best exact-input quote across Uniswap v3 fee tiers, read from the official QuoterV2. */
async function bestQuote(tokenIn: `0x${string}`, tokenOut: `0x${string}`, amountIn: bigint) {
  const results = await Promise.allSettled(
    UNISWAP_V3_FEES.map(async (fee) => {
      const { result } = await rhPublicClient.simulateContract({
        address: UNISWAP_V3.quoterV2,
        abi: quoterAbi,
        functionName: "quoteExactInputSingle",
        args: [{ tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96: 0n }],
      });
      return { fee, amountOut: result[0] };
    }),
  );
  const ok = results
    .filter((r): r is PromiseFulfilledResult<{ fee: (typeof UNISWAP_V3_FEES)[number]; amountOut: bigint }> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((q) => q.amountOut > 0n)
    .sort((a, b) => (b.amountOut > a.amountOut ? 1 : b.amountOut < a.amountOut ? -1 : 0));
  return ok[0] ?? null;
}

export async function getDirectQuote({
  side,
  token,
  usd,
  fromAddress,
  slippageBps = DIRECT_SLIPPAGE_BPS,
}: {
  side: TradeSide;
  token: StockTokenConfig;
  usd: number;
  fromAddress: `0x${string}`;
  slippageBps?: number;
}): Promise<TradeQuote> {
  const [ethUsd, prices, tokenDecimals] = await Promise.all([
    getEthPriceUsd(),
    getLivePrices(),
    onchainDecimals(token.address),
  ]);
  const tokenUsd = prices.prices.find((p) => p.ticker === token.ticker)?.priceUsd;
  if (!tokenUsd) throw new NoDirectRouteError(`No live price for ${token.ticker}`);

  const buy = side === "buy";
  const tokenIn = buy ? WETH_ADDRESS : token.address;
  const tokenOut = buy ? token.address : WETH_ADDRESS;
  const inDecimals = buy ? 18 : tokenDecimals;
  const outDecimals = buy ? tokenDecimals : 18;
  const amountIn = parseUnits((usd / (buy ? ethUsd : tokenUsd)).toFixed(12), inDecimals);
  if (amountIn <= 0n) throw new NoDirectRouteError("Amount too small");

  const q = await bestQuote(tokenIn, tokenOut, amountIn);
  if (!q) throw new NoDirectRouteError(`No Uniswap v3 WETH pool quotes ${token.ticker}`);

  const amountOutMin = (q.amountOut * BigInt(10_000 - slippageBps)) / 10_000n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + DIRECT_DEADLINE_SEC);

  const swap = encodeFunctionData({
    abi: routerAbi,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn,
        tokenOut,
        fee: q.fee,
        recipient: buy ? fromAddress : ADDRESS_THIS,
        amountIn,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0n,
      },
    ],
  });
  const calls = buy
    ? [swap]
    : [swap, encodeFunctionData({ abi: routerAbi, functionName: "unwrapWETH9", args: [amountOutMin, fromAddress] })];
  const data = encodeFunctionData({ abi: routerAbi, functionName: "multicall", args: [deadline, calls] });

  const outUsd = Number(formatUnits(q.amountOut, outDecimals)) * (buy ? tokenUsd : ethUsd);
  const eth = { address: "0x0000000000000000000000000000000000000000" as const, symbol: "ETH", decimals: 18 };
  const tok = { address: token.address, symbol: token.ticker, decimals: tokenDecimals };

  return {
    side,
    route: "uniswap-v3",
    tool: `Uniswap v3 · ${q.fee / 10_000}% pool`,
    slippageBps,
    fromToken: buy ? eth : tok,
    toToken: buy ? tok : eth,
    fromAmount: amountIn.toString(),
    toAmount: q.amountOut.toString(),
    toAmountMin: amountOutMin.toString(),
    fromAmountUsd: usd,
    toAmountUsd: outUsd,
    priceImpactPct: null,
    feesUsd: (usd * q.fee) / 1_000_000,
    gasUsd: null,
    approvalAddress: buy ? null : UNISWAP_V3.swapRouter02,
    transactionRequest: {
      to: UNISWAP_V3.swapRouter02,
      data,
      value: buy ? amountIn.toString() : "0",
      gasLimit: null,
      chainId: CHAIN.id,
    },
    fetchedAt: new Date().toISOString(),
  };
}
