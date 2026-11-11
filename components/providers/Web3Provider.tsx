"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { BridgeProvider } from "@/components/wallet/BridgeProvider";
import { makeWagmiConfig } from "@/lib/wagmi";

/** Wallet + query context. Mounted only on pages that trade (/stocks, /app). */
export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config] = useState(makeWagmiConfig);
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BridgeProvider>{children}</BridgeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
