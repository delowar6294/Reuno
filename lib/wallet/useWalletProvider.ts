"use client";

import { getAccount } from "@wagmi/core";
import { useCallback, useContext } from "react";
import { WagmiContext } from "wagmi";
import { injectedProvider, type Eip1193Provider } from "./provider";

/**
 * Returns a getter for the best EIP-1193 provider:
 * the connected wagmi connector (injected or WalletConnect) when inside a WagmiProvider,
 * otherwise the injected browser wallet. Safe to use on pages without wagmi (footer, docs).
 */
export function useWalletProvider() {
  const config = useContext(WagmiContext);
  return useCallback(async (): Promise<Eip1193Provider | null> => {
    if (config) {
      const { connector, status } = getAccount(config);
      if (connector && status === "connected") {
        try {
          return (await connector.getProvider()) as Eip1193Provider;
        } catch {
          // fall through to the injected wallet
        }
      }
    }
    return injectedProvider();
  }, [config]);
}
