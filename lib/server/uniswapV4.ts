import "server-only";
import { CommandType, RoutePlanner, UniversalRouterVersion } from "@uniswap/universal-router-sdk";
import { Actions, URVersion, V4Planner } from "@uniswap/v4-sdk";
import { encodeAbiParameters, encodeFunctionData, keccak256, parseAbi, parseUnits, type Hex } from "viem";
import { CHAIN } from "@/config/chain";
import { NATIVE_ETH, USDG_ADDRESS, type StockTokenConfig } from "@/config/tokens";
import {
  PERMIT_EXPIRATION_SEC,
  UNISWAP_V4,
  V4_DEADLINE_SEC,
  V4_FEE_TIERS,
  VOLATILE_PAIR_ETH_USDG,
} from "@/config/uniswap";
import type { PermitRequest, TradeQuote, TradeSide, V4Plan } from "@/lib/market-types";
import { onchainDecimals, rhPublicClient } from "./chain";
import { cached } from "./http";
import { getEthPriceUsd, getLivePrices } from "./market";

type Addr = `0x${string}`;
export type PoolKey = { currency0: Addr; currency1: Addr; fee: number; tickSpacing: number; hooks: Addr };
type PathKey = { intermediateCurrency: Addr; fee: number; tickSpacing: number; hooks: Addr; hookData: Hex };

const ZERO = NATIVE_ETH as Addr;

const stateViewAbi = parseAbi([
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128)",
]);
// Verified against the deployed Quoter on 2026-11-11 (path fee is uint24).
const quoterAbi = parseAbi([
  "function quoteExactInputSingle(((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 exactAmount,bytes hookData) params) returns (uint256 amountOut,uint256 gasEstimate)",
  "function quoteExactInput((address exactCurrency,(address intermediateCurrency,uint24 fee,int24 tickSpacing,address hooks,bytes hookData)[] path,uint128 exactAmount) params) returns (uint256 amountOut,uint256 gasEstimate)",
]);
const routerAbi = parseAbi(["function execute(bytes commands, bytes[] inputs, uint256 deadline) payable"]);
const permit2Abi = parseAbi([
  "function allowance(address owner, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)",
]);

export class NoV4RouteError extends Error {}

const sortKey = (a: Addr, b: Addr): [Addr, Addr] => (BigInt(a) < BigInt(b) ? [a, b] : [b, a]);

export const poolId = (k: PoolKey) =>
  keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "uint24" }, { type: "int24" }, { type: "address" }],
      [k.currency0, k.currency1, k.fee, k.tickSpacing, k.hooks],
    ),
  );

async function hasLiquidity(k: PoolKey): Promise<boolean> {
  const id = poolId(k);
  const [slot0, liq] = await Promise.all([
    rhPublicClient.readContract({ address: UNISWAP_V4.stateView, abi: stateViewAbi, functionName: "getSlot0", args: [id] }),
    rhPublicClient.readContract({ address: UNISWAP_V4.stateView, abi: stateViewAbi, functionName: "getLiquidity", args: [id] }),
  ]);
  return slot0[0] > 0n && liq > 0n;
}

/** Pools with liquidity for one token: TOKEN/ETH direct, TOKEN/USDG, and the ETH/USDG legs. Cached 5 min. */
async function discover(token: Addr) {
  return cached(`v4-pools:${token.toLowerCase()}`, 5 * 60_000, async () => {
    const tiers = V4_FEE_TIERS.map((t) => ({ fee: t.fee, tickSpacing: t.tickSpacing, hooks: ZERO }));
    const direct = tiers.map((t) => ({ currency0: ZERO, currency1: token, ...t }));
    const [u0, u1] = sortKey(token, USDG_ADDRESS);
    const tokenUsdg = tiers.map((t) => ({ currency0: u0, currency1: u1, ...t }));
    const ethUsdg = [
      { currency0: ZERO, currency1: USDG_ADDRESS as Addr, ...VOLATILE_PAIR_ETH_USDG, hooks: VOLATILE_PAIR_ETH_USDG.hooks as Addr },
      ...tiers.map((t) => ({ currency0: ZERO, currency1: USDG_ADDRESS as Addr, ...t })),
    ];
    const check = async (keys: PoolKey[]) => {
      const live = await Promise.all(keys.map((k) => hasLiquidity(k).catch(() => false)));
      return keys.filter((_, i) => live[i]);
    };
    const [d, tu, eu] = await Promise.all([check(direct), check(tokenUsdg), check(ethUsdg)]);
    return { direct: d, tokenUsdg: tu, ethUsdg: eu };
  });
}

const toPathKey = (k: PoolKey, out: Addr): PathKey => ({ intermediateCurrency: out, fee: k.fee, tickSpacing: k.tickSpacing, hooks: k.hooks, hookData: "0x" });

type Candidate = { plan: Omit<V4Plan, "amountIn" | "amountOutMin" | "deadline">; amountOut: bigint };

async function quoteCandidates(side: TradeSide, token: Addr, amountIn: bigint): Promise<Candidate[]> {
  const pools = await discover(token);
  const buy = side === "buy";
  const tasks: Promise<Candidate>[] = [];

  for (const k of pools.direct) {
    tasks.push(
      rhPublicClient
        .simulateContract({
          address: UNISWAP_V4.quoter,
          abi: quoterAbi,
          functionName: "quoteExactInputSingle",
          // ETH is always currency0, so buying (ETH in) is zeroForOne.
          args: [{ poolKey: k, zeroForOne: buy, exactAmount: amountIn, hookData: "0x" }],
        })
        .then(({ result }) => ({ plan: { kind: "single" as const, poolKey: k, zeroForOne: buy }, amountOut: result[0] })),
    );
  }
  for (const tu of pools.tokenUsdg) {
    for (const eu of pools.ethUsdg) {
      const path = buy ? [toPathKey(eu, USDG_ADDRESS as Addr), toPathKey(tu, token)] : [toPathKey(tu, USDG_ADDRESS as Addr), toPathKey(eu, ZERO)];
      const currencyIn = buy ? ZERO : token;
      tasks.push(
        rhPublicClient
          .simulateContract({
            address: UNISWAP_V4.quoter,
            abi: quoterAbi,
            functionName: "quoteExactInput",
            args: [{ exactCurrency: currencyIn, path, exactAmount: amountIn }],
          })
          .then(({ result }) => ({ plan: { kind: "path" as const, currencyIn, path }, amountOut: result[0] })),
      );
    }
  }
  const settled = await Promise.allSettled(tasks);
  return settled
    .filter((r): r is PromiseFulfilledResult<Candidate> => r.status === "fulfilled" && r.value.amountOut > 0n)
    .map((r) => r.value)
    .sort((a, b) => (b.amountOut > a.amountOut ? 1 : b.amountOut < a.amountOut ? -1 : 0));
}

/** Universal Router calldata for a v4 exact-input swap, encoded by the official Uniswap SDKs. */
export function encodeV4Swap(plan: V4Plan, permit?: { permit: PermitRequest["values"]; signature: Hex }): { to: Addr; data: Hex; value: string } {
  const amountIn = plan.amountIn;
  const amountOutMin = plan.amountOutMin;
  const currencyIn = plan.kind === "single" ? (plan.zeroForOne ? plan.poolKey.currency0 : plan.poolKey.currency1) : plan.currencyIn;
  const currencyOut =
    plan.kind === "single" ? (plan.zeroForOne ? plan.poolKey.currency1 : plan.poolKey.currency0) : plan.path[plan.path.length - 1].intermediateCurrency;

  const v4 = new V4Planner();
  if (plan.kind === "single") {
    v4.addAction(
      Actions.SWAP_EXACT_IN_SINGLE,
      [{ poolKey: plan.poolKey, zeroForOne: plan.zeroForOne, amountIn, amountOutMinimum: amountOutMin, minHopPriceX36: 0, hookData: "0x" }],
      URVersion.V2_1_2,
    );
  } else {
    v4.addAction(
      Actions.SWAP_EXACT_IN,
      [{ currencyIn, path: plan.path, minHopPriceX36: [], amountIn, amountOutMinimum: amountOutMin }],
      URVersion.V2_1_2,
    );
  }
  v4.addAction(Actions.SETTLE_ALL, [currencyIn, amountIn]);
  v4.addAction(Actions.TAKE_ALL, [currencyOut, amountOutMin]);

  const planner = new RoutePlanner();
  if (permit) {
    planner.addCommand(
      CommandType.PERMIT2_PERMIT,
      [
        {
          details: {
            token: permit.permit.details.token,
            amount: permit.permit.details.amount,
            expiration: permit.permit.details.expiration,
            nonce: permit.permit.details.nonce,
          },
          spender: permit.permit.spender,
          sigDeadline: permit.permit.sigDeadline,
        },
        permit.signature,
      ],
      false,
      UniversalRouterVersion.V2_1_2,
    );
  }
  planner.addCommand(CommandType.V4_SWAP, [v4.finalize()], false, UniversalRouterVersion.V2_1_2);

  const data = encodeFunctionData({
    abi: routerAbi,
    functionName: "execute",
    args: [planner.commands as Hex, planner.inputs as Hex[], BigInt(plan.deadline)],
  });
  return { to: UNISWAP_V4.universalRouter, data, value: currencyIn === ZERO ? amountIn : "0" };
}

/** Permit2 typed data (PermitSingle) for the Universal Router, or null if a live allowance already covers the amount. */
async function permitFor(owner: Addr, token: Addr, amountIn: bigint, deadline: number): Promise<PermitRequest | null> {
  const [amount, expiration, nonce] = await rhPublicClient.readContract({
    address: UNISWAP_V4.permit2,
    abi: permit2Abi,
    functionName: "allowance",
    args: [owner, token, UNISWAP_V4.universalRouter],
  });
  const now = Math.floor(Date.now() / 1000);
  if (amount >= amountIn && expiration > now + 120) return null;
  return {
    domain: { name: "Permit2", chainId: CHAIN.id, verifyingContract: UNISWAP_V4.permit2 },
    values: {
      details: { token, amount: amountIn.toString(), expiration: String(now + PERMIT_EXPIRATION_SEC), nonce: String(nonce) },
      spender: UNISWAP_V4.universalRouter,
      sigDeadline: String(deadline),
    },
  };
}

export async function getV4Quote({
  side,
  token,
  usd,
  fromAddress,
  slippageBps,
}: {
  side: TradeSide;
  token: StockTokenConfig;
  usd: number;
  fromAddress: Addr;
  slippageBps: number;
}): Promise<TradeQuote> {
  const [ethUsd, prices, tokenDecimals] = await Promise.all([getEthPriceUsd(), getLivePrices(), onchainDecimals(token.address)]);
  const tokenUsd = prices.prices.find((p) => p.ticker === token.ticker)?.priceUsd;
  if (!tokenUsd) throw new NoV4RouteError(`No live price for ${token.ticker}`);

  const buy = side === "buy";
  const inDecimals = buy ? 18 : tokenDecimals;
  const amountIn = parseUnits((usd / (buy ? ethUsd : tokenUsd)).toFixed(12), inDecimals);
  if (amountIn <= 0n) throw new NoV4RouteError("Amount too small");

  const [best] = await quoteCandidates(side, token.address, amountIn);
  if (!best) throw new NoV4RouteError(`No v4 pool quotes ${token.ticker}`);

  const amountOutMin = (best.amountOut * BigInt(10_000 - slippageBps)) / 10_000n;
  const deadline = Math.floor(Date.now() / 1000) + V4_DEADLINE_SEC;
  const plan = { ...best.plan, amountIn: amountIn.toString(), amountOutMin: amountOutMin.toString(), deadline } as V4Plan;

  const permit = buy ? null : await permitFor(fromAddress, token.address, amountIn, deadline);
  const tx = permit ? null : encodeV4Swap(plan);

  const eth = { address: ZERO, symbol: "ETH", decimals: 18 };
  const tok = { address: token.address, symbol: token.ticker, decimals: tokenDecimals };
  const hops = plan.kind === "single" ? `${plan.poolKey.fee / 10_000}% pool` : "2 hops via USDG";
  return {
    side,
    route: "uniswap-v4",
    tool: `Uniswap v4 · ${hops}`,
    slippageBps,
    fromToken: buy ? eth : tok,
    toToken: buy ? tok : eth,
    fromAmount: amountIn.toString(),
    toAmount: best.amountOut.toString(),
    toAmountMin: amountOutMin.toString(),
    fromAmountUsd: null,
    toAmountUsd: null,
    priceImpactPct: null,
    feesUsd: 0,
    gasUsd: null,
    // Sells: ERC-20 approval goes to Permit2; the router then spends via a signed Permit2 allowance.
    approvalAddress: buy ? null : UNISWAP_V4.permit2,
    transactionRequest: tx ? { ...tx, gasLimit: null, chainId: CHAIN.id } : null,
    permit,
    v4Plan: plan,
    fetchedAt: new Date().toISOString(),
  };
}
