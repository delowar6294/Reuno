"use client";

import { useEffect, useState } from "react";
import type { EIP1193Provider } from "viem";

export type Eip6963Info = { uuid: string; name: string; icon: string; rdns: string };
export type Eip6963Detail = { info: Eip6963Info; provider: EIP1193Provider };

/**
 * Wallets that announce themselves via EIP-6963 (name, rdns, their own official icon, and their provider).
 * We listen ourselves because wagmi merges some announcements into SDK connectors with the same rdns
 * (MetaMask, Coinbase Wallet), which would hide them from an "installed" list.
 */
export function useAnnouncedWallets(active: boolean): Eip6963Detail[] {
  const [wallets, setWallets] = useState<Eip6963Detail[]>([]);
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const seen = new Map<string, Eip6963Detail>();
    const onAnnounce = (e: Event) => {
      const d = (e as CustomEvent<Eip6963Detail>).detail;
      if (!d?.info?.rdns || !d.info.name || !d.provider || seen.has(d.info.rdns)) return;
      seen.set(d.info.rdns, d);
      setWallets([...seen.values()]);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, [active]);
  return wallets;
}
