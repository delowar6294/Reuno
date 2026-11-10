"use client";

import { createPublicClient, erc20Abi, http } from "viem";
import { CHAIN, robinhoodChain } from "@/config/chain";
import { addRobinhoodChain, type WalletResult } from "./addNetwork";
import { injectedProvider, isUserRejection, type Eip1193Provider } from "./provider";

let client: ReturnType<typeof createPublicClient> | null = null;
const rhClient = () => (client ??= createPublicClient({ chain: robinhoodChain, transport: http() }));

const decimalsCache = new Map<string, number>();

/** ERC-20 decimals read from the token contract on Robinhood Chain. */
export async function readDecimals(address: `0x${string}`): Promise<number> {
  const key = address.toLowerCase();
  const hit = decimalsCache.get(key);
  if (hit !== undefined) return hit;
  const d = await rhClient().readContract({ address, abi: erc20Abi, functionName: "decimals" });
  decimalsCache.set(key, d);
  return d;
}

export type WatchableToken = { address: `0x${string}`; symbol: string; image?: string };

/**
 * EIP-747 wallet_watchAsset. Wallets add the token to the network that is currently selected,
 * so we make sure the wallet is on Robinhood Chain first.
 */
export async function addTokenToWallet(token: WatchableToken, provider?: Eip1193Provider | null): Promise<WalletResult> {
  const p = provider ?? injectedProvider();
  if (!p) return { ok: false, cancelled: false, message: "No wallet found" };

  let decimals: number;
  try {
    decimals = await readDecimals(token.address);
  } catch {
    return { ok: false, cancelled: false, message: "Could not read token decimals from Robinhood Chain" };
  }

  try {
    const chain = String(await p.request({ method: "eth_chainId" })).toLowerCase();
    if (chain !== CHAIN.hexId) {
      const switched = await addRobinhoodChain(p);
      if (!switched.ok) return switched;
    }
  } catch {
    // eth_chainId unsupported; let the wallet decide below.
  }

  try {
    const added = await p.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol.slice(0, 11),
          decimals,
          ...(token.image ? { image: token.image } : {}),
        },
      },
    });
    if (added === false) return { ok: false, cancelled: true, message: "Cancelled in wallet" };
    return { ok: true, message: `${token.symbol} added` };
  } catch (err) {
    if (isUserRejection(err)) return { ok: false, cancelled: true, message: "Cancelled in wallet" };
    const e = err as { message?: string };
    return { ok: false, cancelled: false, message: e?.message?.slice(0, 120) ?? "Your wallet could not add the token" };
  }
}
