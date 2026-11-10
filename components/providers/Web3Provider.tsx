"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { injected } from "@wagmi/core";
import { walletConnect } from "reuno-walletconnect-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { RH_RPC_URL, robinhoodChain } from "@/config/chain";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

function makeConfig() {
  return createConfig({
    chains: [robinhoodChain],
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
                url: typeof window === "undefined" ? "https://reuno.xyz" : window.location.origin,
                icons: [],
              },
            }),
          ]
        : []),
    ],
    transports: { [robinhoodChain.id]: http(RH_RPC_URL) },
    ssr: true,
  });
}

/** Wallet + query context. Mounted only on pages that trade (/stocks, /app). */
export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config] = useState(makeConfig);
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
