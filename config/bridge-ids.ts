// Source chain ids for "Get ETH on Robinhood Chain" (Ethereum, Base, Arbitrum One, OP Mainnet, BNB Chain, Polygon).
// Kept free of viem imports so server routes don't pull in viem's full chain registry.
// Each id was checked on 2026-11-11 to return a LI.FI route to native ETH on chain 4663.
export const BRIDGE_SOURCE_IDS: readonly number[] = [1, 8453, 42161, 10, 56, 137];
