"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { injected } from "@wagmi/core";
import { walletConnect } from "reuno-walletconnect-connector";
import { arbitrum, base, bsc, mainnet, optimism, polygon } from "viem/chains";
import { createConfig, http, WagmiProvider } from "wagmi";
import { BridgeProvider } from "@/components/wallet/BridgeProvider";
import { BRIDGE_SOURCE_CHAINS } from "@/config/bridge";
import { RH_RPC_URL, robinhoodChain } from "@/config/chain";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://reuno.xyz").replace(/\/$/, "");

let warned = false;

function makeConfig() {
  if (!WC_PROJECT_ID && process.env.NODE_ENV !== "production" && typeof window !== "undefined" && !warned) {
    warned = true;
    console.warn(
      "[reuno] NEXT_PUBLIC_WC_PROJECT_ID is not set, so the WalletConnect option is hidden. " +
        "Create a project at https://cloud.reown.com, add it to .env.local, and allowlist your domain.",
    );
  }
  return createConfig({
    // Robinhood Chain first (default). The others exist only as sources for bridging gas in.
    chains: [robinhoodChain, ...BRIDGE_SOURCE_CHAINS],
    connectors: [
      injected({ shimDisconnect: true }),
      ...(WC_PROJECT_ID
        ? [
            walletConnect({
              projectId: WC_PROJECT_ID,
              showQrModal: true,
              metadata: {
                name: "Reuno",
                description: "Private rails for people and their agents.",
                // Must match a domain allowlisted for this project in the Reown dashboard.
                url: SITE_URL,
                icons: [`${SITE_URL}/brand/reuno-logo.png`],
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
    ...(typeof window === "undefined" ? { storage: null } : {}),
  });
}

/** Wallet + query context. Mounted only on pages that trade (/stocks, /app). */
export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config] = useState(makeConfig);
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BridgeProvider>{children}</BridgeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
