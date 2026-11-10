"use client";

import { ADD_CHAIN_PARAMS, CHAIN } from "@/config/chain";
import { errorCode, injectedProvider, isUserRejection, type Eip1193Provider } from "./provider";

export type WalletResult = { ok: true; message: string } | { ok: false; cancelled: boolean; message: string };

const READY = "Robinhood Chain is ready";
const CANCELLED = "Cancelled in wallet";

async function currentChain(p: Eip1193Provider): Promise<string | null> {
  try {
    return String(await p.request({ method: "eth_chainId" })).toLowerCase();
  } catch {
    return null;
  }
}

const add = (p: Eip1193Provider) => p.request({ method: "wallet_addEthereumChain", params: [ADD_CHAIN_PARAMS] });
const sw = (p: Eip1193Provider) =>
  p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.hexId }] });

function failure(err: unknown): WalletResult {
  if (isUserRejection(err)) return { ok: false, cancelled: true, message: CANCELLED };
  const e = err as { shortMessage?: string; message?: string };
  return { ok: false, cancelled: false, message: e?.shortMessage ?? e?.message ?? "Your wallet could not add the network." };
}

/**
 * Adds Robinhood Chain to the wallet (EIP-3085) and switches to it (EIP-3326).
 * - 4001 (user rejected) → "Cancelled in wallet"
 * - already added → the add call is skipped or tolerated, then we just switch
 * - 4902 (unknown chain) on switch → add again, then switch
 */
export async function addRobinhoodChain(provider?: Eip1193Provider | null): Promise<WalletResult> {
  const p = provider ?? injectedProvider();
  if (!p) return { ok: false, cancelled: false, message: "No wallet found. Use the manual settings below." };

  if ((await currentChain(p)) === CHAIN.hexId) return { ok: true, message: READY };

  try {
    await add(p);
  } catch (err) {
    if (isUserRejection(err)) return failure(err);
    // Some wallets throw when the chain already exists. That is fine: switching below settles it.
  }

  try {
    await sw(p);
  } catch (err) {
    if (isUserRejection(err)) return failure(err);
    if (errorCode(err) === 4902) {
      try {
        await add(p);
        await sw(p);
      } catch (retryErr) {
        return failure(retryErr);
      }
    } else {
      return failure(err);
    }
  }

  // Some wallets resolve before the switch lands; confirm.
  const now = await currentChain(p);
  if (now !== null && now !== CHAIN.hexId) {
    return { ok: false, cancelled: false, message: "Your wallet did not switch. Pick Robinhood Chain in the wallet's network menu." };
  }
  return { ok: true, message: READY };
}
