"use client";

import { sendTransaction } from "@wagmi/core";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount, useConfig, usePublicClient } from "wagmi";
import { CHAIN } from "@/config/chain";
import { addRobinhoodChain } from "./addNetwork";
import { isUserRejection, type Eip1193Provider } from "./provider";
import { preflightTx, revertReasonAt, txTarget, type PreflightResult, type TxCall } from "./tx";

/** Stable key for a call (bigints → strings), so effects re-run only when the call really changes. */
export const callKey = (call: TxCall | null) =>
  call ? JSON.stringify(call, (_k, v) => (typeof v === "bigint" ? v.toString() : v)) : "";

export type PreflightState = { status: "idle" } | { status: "checking" } | PreflightResult;

/** Runs the gas/simulation preflight whenever `call` changes. Never opens the wallet. */
export function usePreflight(call: TxCall | null, ticker?: string) {
  const pc = usePublicClient({ chainId: CHAIN.id });
  const { address } = useAccount();
  const [state, setState] = useState<PreflightState>({ status: "idle" });
  const [nonce, setNonce] = useState(0);
  const key = callKey(call);
  const callRef = useRef(call);
  callRef.current = call;

  useEffect(() => {
    const c = callRef.current;
    if (!c || !pc || !address) {
      setState({ status: "idle" });
      return;
    }
    let live = true;
    setState({ status: "checking" });
    preflightTx(pc, address, c, ticker).then((r) => {
      if (live) setState(r);
    });
    return () => {
      live = false;
    };
  }, [key, pc, address, ticker, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { preflight: state, refresh };
}

export type TxPhase =
  | { phase: "idle" }
  | { phase: "switching" }
  | { phase: "simulating" }
  | { phase: "wallet" }
  | { phase: "pending"; hash: `0x${string}` }
  | { phase: "success"; hash: `0x${string}` }
  | { phase: "reverted"; hash: `0x${string}`; message: string }
  | { phase: "blocked"; result: PreflightResult }
  | { phase: "error"; message: string };

/**
 * Sends a transaction the safe way:
 * ensure Robinhood Chain → simulate + estimate (abort on revert, wallet stays closed) →
 * EIP-1559 fees → user signs in their wallet → wait for 1 confirmation → refresh balances.
 */
export function useTxRunner(ticker?: string) {
  const config = useConfig();
  const pc = usePublicClient({ chainId: CHAIN.id });
  const { address, chainId, connector } = useAccount();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TxPhase>({ phase: "idle" });

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  const run = useCallback(
    async (call: TxCall): Promise<boolean> => {
      if (!address || !pc) {
        setState({ phase: "error", message: "Connect a wallet first." });
        return false;
      }
      try {
        // 1. Make sure the wallet is on Robinhood Chain right before sending.
        if (chainId !== CHAIN.id) {
          setState({ phase: "switching" });
          const provider = connector ? ((await connector.getProvider()) as Eip1193Provider) : null;
          const sw = await addRobinhoodChain(provider);
          if (!sw.ok) {
            setState({ phase: "error", message: sw.message });
            return false;
          }
        }

        // 2. Simulate and size gas with fresh fees.
        setState({ phase: "simulating" });
        const pf = await preflightTx(pc, address, call, ticker);
        if (pf.status !== "ok") {
          setState({ phase: "blocked", result: pf });
          return false;
        }

        // 3. The user's wallet reviews and signs. Reuno never signs.
        setState({ phase: "wallet" });
        const { to, data, value } = txTarget(call);
        const hash = await sendTransaction(config, {
          account: address as Address,
          chainId: CHAIN.id,
          to,
          data,
          value,
          gas: pf.gasLimit,
          maxFeePerGas: pf.maxFeePerGas,
          maxPriorityFeePerGas: pf.maxPriorityFeePerGas,
        });

        // 4. Wait for one confirmation.
        setState({ phase: "pending", hash });
        const receipt = await pc.waitForTransactionReceipt({ hash, confirmations: 1 });
        await queryClient.invalidateQueries();
        if (receipt.status === "success") {
          setState({ phase: "success", hash });
          return true;
        }
        const message = await revertReasonAt(pc, address, call, receipt.blockNumber, ticker);
        setState({ phase: "reverted", hash, message });
        return false;
      } catch (e) {
        if (isUserRejection(e)) {
          setState({ phase: "error", message: "Cancelled in wallet" });
        } else {
          const err = e as { shortMessage?: string; message?: string };
          setState({ phase: "error", message: err.shortMessage ?? err.message ?? "Something went wrong." });
        }
        return false;
      }
    },
    [address, pc, chainId, connector, config, queryClient, ticker],
  );

  const busy = state.phase === "switching" || state.phase === "simulating" || state.phase === "wallet" || state.phase === "pending";
  return { state, run, reset, busy };
}
