"use client";

import { WC_PROJECT_ID } from "@/lib/wagmi";
import type { WalletConfig } from "@/config/wallets";

type Listing = { id: string; name: string; mobile?: { native?: string | null; universal?: string | null } };

const cache = new Map<string, Listing | null>();

/** Looks up a wallet's mobile links in the Reown (WalletConnect) explorer. Needs a project id. */
async function listing(w: WalletConfig): Promise<Listing | null> {
  if (!WC_PROJECT_ID) return null;
  if (cache.has(w.id)) return cache.get(w.id)!;
  const q = w.wcExplorerId ? `ids=${w.wcExplorerId}` : `search=${encodeURIComponent(w.name)}`;
  try {
    const res = await fetch(`https://explorer-api.walletconnect.com/v3/wallets?projectId=${WC_PROJECT_ID}&${q}`);
    const body = (await res.json()) as { listings?: Record<string, Listing> };
    const all = Object.values(body.listings ?? {});
    const hit = w.wcExplorerId ? (all.find((l) => l.id === w.wcExplorerId) ?? null) : (all.find((l) => l.name.toLowerCase() === w.name.toLowerCase()) ?? null);
    cache.set(w.id, hit);
    return hit;
  } catch {
    return null;
  }
}

/** Deep link that opens the wallet app with a WalletConnect pairing URI (universal link preferred). */
export async function walletConnectDeepLink(w: WalletConfig, uri: string): Promise<string | null> {
  const l = await listing(w);
  const enc = encodeURIComponent(uri);
  if (l?.mobile?.universal) return `${l.mobile.universal.replace(/\/$/, "")}/wc?uri=${enc}`;
  if (l?.mobile?.native) return `${l.mobile.native.replace(/:?\/*$/, "")}://wc?uri=${enc}`;
  return null;
}
