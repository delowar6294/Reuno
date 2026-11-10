import { defineChain } from "viem";

// source: https://docs.robinhood.com/chain/connecting and https://docs.robinhood.com/chain/add-network-to-wallet
const DEFAULT_RPC = "https://rpc.mainnet.chain.robinhood.com/";
const DEFAULT_EXPLORER = "https://robinhoodchain.blockscout.com";

export const RH_RPC_URL = process.env.NEXT_PUBLIC_RH_RPC_URL || DEFAULT_RPC;
export const RH_EXPLORER_URL = (process.env.NEXT_PUBLIC_RH_EXPLORER_URL || DEFAULT_EXPLORER).replace(/\/$/, "");

export const CHAIN = {
  id: 4663,
  name: "Robinhood Chain",
  rpc: RH_RPC_URL,
  explorer: RH_EXPLORER_URL,
  /** Network id used by DexScreener (verified against a live response). */
  dexscreenerId: "robinhood",
  /** Network id used by GeckoTerminal (verified via /api/v2/networks). */
  geckoterminalId: "robinhood",
} as const;

export const robinhoodChain = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RH_RPC_URL] } },
  blockExplorers: { default: { name: "Blockscout", url: RH_EXPLORER_URL } },
});

export const explorerAddressUrl = (address: string) => `${RH_EXPLORER_URL}/address/${address}`;
export const explorerTokenUrl = (address: string) => `${RH_EXPLORER_URL}/token/${address}`;
export const explorerTxUrl = (hash: string) => `${RH_EXPLORER_URL}/tx/${hash}`;
