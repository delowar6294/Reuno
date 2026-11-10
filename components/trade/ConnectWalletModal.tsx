"use client";

import { Loader2, QrCode, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { Modal } from "@/components/ui/Modal";
import { AddChainButton } from "@/components/wallet/AddChainButton";
import { CHAIN } from "@/config/chain";

export function ConnectWalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connectors, connect, isPending, variables, error, reset } = useConnect();
  const { isConnected } = useAccount();
  const [hasInjected, setHasInjected] = useState<boolean | null>(null);

  // Re-check on every open: some extensions inject window.ethereum after page load.
  useEffect(() => {
    if (open) setHasInjected(typeof window !== "undefined" && "ethereum" in window);
  }, [open]);

  useEffect(() => {
    if (open && isConnected) onClose();
  }, [open, isConnected, onClose]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return (
    <Modal open={open} onClose={onClose} title="Connect wallet">
      <div className="mb-6 rounded-sm border border-line-1 bg-surface-1 p-3">
        <p className="mb-3 text-xs text-ink-3">New to Robinhood Chain? Add the network first.</p>
        <AddChainButton />
      </div>
      <p className="text-sm text-ink-2">
        Reuno never asks for or holds a private key. Your wallet signs every transaction on {CHAIN.name} (chain id{" "}
        {CHAIN.id}).
      </p>
      <ul className="mt-6 flex flex-col gap-3">
        {connectors.map((c) => {
          const isWc = c.type === "walletConnect";
          const unavailable = !isWc && hasInjected === false;
          const pending = isPending && variables?.connector && "uid" in variables.connector && variables.connector.uid === c.uid;
          return (
            <li key={c.uid}>
              <button
                type="button"
                disabled={unavailable || isPending}
                onClick={() => connect({ connector: c })}
                className="flex h-14 w-full items-center gap-3 rounded-md border border-line-2 bg-surface-2 px-4 text-left text-ink-1 transition-colors duration-[180ms] hover:border-line-3 hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-3 text-brand-300">
                  {isWc ? (
                    <QrCode className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Wallet className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  )}
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{isWc ? "WalletConnect" : c.name === "Injected" ? "Browser wallet" : c.name}</span>
                  <span className="text-xs text-ink-3">
                    {isWc ? "Scan with a mobile wallet" : unavailable ? "No browser wallet found" : "MetaMask, Rabby, Robinhood Wallet and more"}
                  </span>
                </span>
                {pending && <Loader2 className="h-4 w-4 animate-spin text-brand-300" strokeWidth={1.75} aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="mt-4 text-sm text-bad" role="alert">
          {"shortMessage" in error && typeof error.shortMessage === "string" ? error.shortMessage : error.message}
        </p>
      )}
    </Modal>
  );
}
