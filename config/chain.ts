import { defineChain } from "viem";

// Single source of truth for Robinhood Chain mainnet parameters.
// source: https://docs.robinhood.com/chain/add-network-to-wallet (Chain ID 4663, Default RPC URL, Currency Symbol ETH, Block Explorer)
// source: https://docs.robinhood.com/chain/connecting (public RPC; rate-limited, use a provider URL in production)
// Verified 2026-11-11: eth_chainId on the RPC returned 0x1237 and eth_blockNumber returned 0x6a14b33.
const DEFAULT_RPC = "https://rpc.mainnet.chain.robinhood.com/";
const DEFAULT_EXPLORER = "https://robinhoodchain.blockscout.com";

export const RH_RPC_URL = process.env.NEXT_PUBLIC_RH_RPC_URL || DEFAULT_RPC;
export const RH_EXPLORER_URL = (process.env.NEXT_PUBLIC_RH_EXPLORER_URL || DEFAULT_EXPLORER).replace(/\/$/, "");

/** RPC URL handed to wallets. Always the official public one, so users never get a private provider key. */
export const RH_PUBLIC_RPC_URL = DEFAULT_RPC;

export const CHAIN = {
  id: 4663,
  hexId: "0x1237",
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpc: RH_RPC_URL,
  explorer: RH_EXPLORER_URL,
  /** Network id used by DexScreener (verified against a live response). */
  dexscreenerId: "robinhood",
  /** Network id used by GeckoTerminal (verified via /api/v2/networks). */
  geckoterminalId: "robinhood",
} as const;

/** Exact params for EIP-3085 wallet_addEthereumChain. */
export const ADD_CHAIN_PARAMS = {
  chainId: CHAIN.hexId,
  chainName: CHAIN.name,
  nativeCurrency: CHAIN.nativeCurrency,
  rpcUrls: [RH_PUBLIC_RPC_URL],
  blockExplorerUrls: [DEFAULT_EXPLORER],
};

export const robinhoodChain = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: CHAIN.nativeCurrency,
  rpcUrls: { default: { http: [RH_RPC_URL] } },
  blockExplorers: { default: { name: "Blockscout", url: RH_EXPLORER_URL } },
});

export const explorerAddressUrl = (address: string) => `${RH_EXPLORER_URL}/address/${address}`;
export const explorerTokenUrl = (address: string) => `${RH_EXPLORER_URL}/token/${address}`;
export const explorerTxUrl = (hash: string) => `${RH_EXPLORER_URL}/tx/${hash}`;
