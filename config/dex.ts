// Direct-DEX fallback, used only when LI.FI returns no route for a token.
// Every highest-liquidity stock-token pool on DexScreener has dexId "uniswap", so the fallback uses
// Uniswap v3's official Robinhood Chain deployment. Each contract was confirmed to have bytecode via
// eth_getCode on the official Robinhood Chain RPC (2026-11-11).

export const UNISWAP_V3 = {
  // source: https://docs.uniswap.org/docs/protocols/v3/deployments/v3-robinhood-chain-deployments (UniswapV3Factory)
  // source: https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/addresses.ts (ROBINHOOD_ADDRESSES.v3CoreFactoryAddress)
  factory: "0x1f7d7550b1b028f7571e69a784071f0205fd2efa",
  // source: https://docs.uniswap.org/docs/protocols/v3/deployments/v3-robinhood-chain-deployments (QuoterV2)
  quoterV2: "0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7",
  // source: https://docs.uniswap.org/docs/protocols/v3/deployments/v3-robinhood-chain-deployments (SwapRouter02)
  swapRouter02: "0xcaf681a66d020601342297493863e78c959e5cb2",
} as const;

/** Uniswap v3 fee tiers to probe, in hundredths of a basis point. */
export const UNISWAP_V3_FEES = [100, 500, 3000, 10000] as const;

export const DIRECT_SLIPPAGE_BPS = 50; // 0.5%
export const DIRECT_DEADLINE_SEC = 600; // 10 minutes
