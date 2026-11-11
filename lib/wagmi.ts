"use client";

import { injected } from "@wagmi/core";
import { coinbaseWallet } from "reuno-coinbase-connector";
import { metaMask } from "reuno-metamask-connector";
import { walletConnect } from "reuno-walletconnect-connector";
import { arbitrum, base, bsc, mainnet, optimism, polygon } from "viem/chains";
import { createConfig, http } from "wagmi";
import { BRIDGE_SOURCE_CHAINS } from "@/config/bridge";
import { RH_RPC_URL, robinhoodChain } from "@/config/chain";

export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://reuno.xyz").replace(/\/$/, "");
const LOGO_URL = `${SITE_URL}/brand/reuno-logo.png`;

let warned = false;

export function makeWagmiConfig() {
  const browser = typeof window !== "undefined";
  if (!WC_PROJECT_ID && process.env.NODE_ENV !== "production" && browser && !warned) {
    warned = true;
    console.warn(
      "[reuno] NEXT_PUBLIC_WC_PROJECT_ID is not set, so the WalletConnect option is hidden. " +
        "Create a project at https://cloud.reown.com, add it to .env.local, and allowlist your domain.",
    );
  }
  return createConfig({
    // Robinhood Chain first (default). The others exist only as sources for bridging gas in.
    chains: [robinhoodChain, ...BRIDGE_SOURCE_CHAINS],
    // EIP-6963: every installed extension announces itself (name, rdns, official icon) and becomes a connector.
    multiInjectedProviderDiscovery: true,
    // Connectors exist only in the browser: during server prerender the wallet SDKs would load Node polyfills
    // that touch the global `localStorage` (Node 26 ExperimentalWarning), and nothing can connect there anyway.
    connectors: !browser ? [] : [
      injected({ shimDisconnect: true }),
      coinbaseWallet({ appName: "Reuno", appLogoUrl: LOGO_URL, preference: "all" }),
      metaMask({ dappMetadata: { name: "Reuno", url: SITE_URL, iconUrl: LOGO_URL } }),
      ...(WC_PROJECT_ID
        ? [
            walletConnect({
              projectId: WC_PROJECT_ID,
              // We render our own QR panel.
              showQrModal: false,
              metadata: {
                name: "Reuno",
                description: "Private rails for people and their agents.",
                // Must match a domain allowlisted for this project in the Reown dashboard.
                url: SITE_URL,
                icons: [LOGO_URL],
              },
            }),
          ]
        : []),
    ],
    // Source chains use viem's default public RPCs; they are only read for balances and gas while bridging.
    transports: {
      [robinhoodChain.id]: http(RH_RPC_URL),
      [mainnet.id]: http(),
      [base.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [bsc.id]: http(),
      [polygon.id]: http(),
    },
    ssr: true,
    // No persisted store during server prerender: wagmi's persist layer touches the global `localStorage`,
    // which Node 26 reports as an ExperimentalWarning. In the browser the default localStorage-backed store is used.
    ...(browser ? {} : { storage: null }),
  });
}
