// Uniswap v4 on Robinhood Chain (4663). Used internally for swaps; never named in the UI.
// Every address below has bytecode on chain 4663 (eth_getCode via the official RPC, 2026-11-11).

export const UNISWAP_V4 = {
  // source: https://docs.uniswap.org/contracts/v4/deployments (section "Robinhood Chain: 4663", PoolManager)
  poolManager: "0x8366a39cc670b4001a1121b8f6a443a643e40951",
  // source: https://docs.uniswap.org/contracts/v4/deployments (Robinhood Chain: 4663, PositionManager)
  positionManager: "0x58daec3116aae6d93017baaea7749052e8a04fa7",
  // source: https://docs.uniswap.org/contracts/v4/deployments (Robinhood Chain: 4663, Quoter)
  quoter: "0x8dc178efb8111bb0973dd9d722ebeff267c98f94",
  // source: https://docs.uniswap.org/contracts/v4/deployments (Robinhood Chain: 4663, StateView)
  stateView: "0xf3334192d15450cdd385c8b70e03f9a6bd9e673b",
  // source: https://docs.uniswap.org/contracts/v4/deployments (Robinhood Chain: 4663, "Universal Router 2.1.2");
  // also @uniswap/universal-router-sdk CHAIN_CONFIGS[4663].routerConfigs["2.1.2"]
  universalRouter: "0x204FAca1764B154221e35c0d20aBb3c525710498",
  // source: https://docs.uniswap.org/contracts/v4/deployments (Robinhood Chain: 4663, Permit2; canonical Permit2 address)
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
} as const;

/** Version string the official SDKs use to encode calls for the router above. */
export const UNIVERSAL_ROUTER_VERSION = "2.1.2" as const;

/** Hookless fee tiers with Uniswap's standard tick spacings. */
export const V4_FEE_TIERS = [
  { fee: 100, tickSpacing: 1 },
  { fee: 500, tickSpacing: 10 },
  { fee: 3000, tickSpacing: 60 },
  { fee: 10000, tickSpacing: 200 },
] as const;

// Uniswap Labs' VolatilePair hook pool: the official ETH/USDG pool, used as the ETH leg of TOKEN → USDG → ETH routes.
// source: https://docs.uniswap.org/docs/protocols/uniswap-labs-hooks/volatile-pair/deployments
// ("Robinhood Chain: ETH / USDG": currency0 ETH, currency1 USDG, fee dynamic 0x800000, tick spacing 1,
//  hook = VolatilePairHook (proxy) 0x987E330F00B79864a07FE81dFaC344D0078ABCC0)
export const VOLATILE_PAIR_ETH_USDG = {
  fee: 0x800000,
  tickSpacing: 1,
  hooks: "0x987E330F00B79864a07FE81dFaC344D0078ABCC0",
} as const;

export const V4_DEADLINE_SEC = 600; // 10 minutes
export const PERMIT_EXPIRATION_SEC = 1800; // Permit2 allowance signed for 30 minutes, exact amount
