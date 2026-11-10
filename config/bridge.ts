import { arbitrum, base, bsc, mainnet, optimism, polygon } from "viem/chains";

// Source chains offered for "Get ETH on Robinhood Chain". Each one was checked on 2026-11-11:
// GET https://li.quest/v1/quote?fromChain=<id>&toChain=4663&fromToken=<native>&toToken=<native>
// returned a route (tool: layerswap) whose transactionRequest.chainId equals the source chain.
export const BRIDGE_SOURCE_CHAINS = [mainnet, base, arbitrum, optimism, bsc, polygon] as const;

export type BridgeSourceChainId = (typeof BRIDGE_SOURCE_CHAINS)[number]["id"];

export const bridgeChainById = (id: number) => BRIDGE_SOURCE_CHAINS.find((c) => c.id === id);
