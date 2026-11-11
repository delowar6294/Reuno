"use client";

import { ArrowLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { injected } from "@wagmi/core";
import type { Connector, CreateConnectorFn } from "wagmi";
import { useAccount, useConnect } from "wagmi";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AddNetworkManual } from "@/components/wallet/AddNetworkManual";
import { WalletConnectQr } from "@/components/wallet/WalletConnectQr";
import { WalletLogo } from "@/components/wallet/WalletLogo";
import { CHAIN } from "@/config/chain";
import { WALLETCONNECT_LOGO, WALLETS, type WalletConfig } from "@/config/wallets";
import { addRobinhoodChain } from "@/lib/wallet/addNetwork";
import { isMobileDevice, mobileOs } from "@/lib/wallet/device";
import { useAnnouncedWallets } from "@/lib/wallet/eip6963";
import { isUserRejection, type Eip1193Provider } from "@/lib/wallet/provider";
import { walletConnectDeepLink } from "@/lib/wallet/walletconnectExplorer";
import { cn } from "@/lib/cn";

const rowClass =
  "flex min-h-14 w-full items-center gap-3 rounded-md border border-line-2 bg-surface-1 px-3 py-2 text-left text-ink-1 transition-colors duration-[180ms] hover:border-line-3 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60";

type View = { kind: "list" } | { kind: "qr"; uri: string | null; wallet?: WalletConfig };

/**
 * Wallet picker. Installed extensions (EIP-6963, with their own official icons) first, then the popular list
 * with official logos from /public/wallets, then WalletConnect with our own QR panel.
 */
export function WalletModal({
  open,
  onClose,
  addChainAfterConnect = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Add + switch to Robinhood Chain as soon as a wallet connects. */
  addChainAfterConnect?: boolean;
}) {
  const { connectors, connectAsync, isPending, variables, reset } = useConnect();
  const { isConnected, connector: active } = useAccount();
  const [view, setView] = useState<View>({ kind: "list" });
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [addAfter, setAddAfter] = useState(addChainAfterConnect);
  const [chainNote, setChainNote] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [hasEth, setHasEth] = useState(false);
  const wcUnsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) return;
    setMobile(isMobileDevice());
    setHasEth(typeof window !== "undefined" && "ethereum" in window);
    setAddAfter(addChainAfterConnect);
    setChainNote(null);
    setError(null);
    setView({ kind: "list" });
  }, [open, addChainAfterConnect]);

  useEffect(() => {
    if (!open) {
      reset();
      wcUnsub.current?.();
      wcUnsub.current = null;
    }
  }, [open, reset]);

  const wc = connectors.find((c) => c.type === "walletConnect");
  const coinbaseSdk = connectors.find((c) => c.id === "coinbaseWalletSDK");
  const metaMaskSdk = connectors.find((c) => c.id === "metaMaskSDK");

  // Installed = extensions that announced themselves via EIP-6963, shown with their own official icon.
  // Each connects through the exact provider it announced. (wagmi folds the MetaMask and Coinbase announcements
  // into its SDK connectors, so for those we build an injected connector around the announced provider.)
  const announced = useAnnouncedWallets(open);
  const installed = useMemo(() => {
    const rows: { key: string; name: string; icon?: string; connector: Connector | CreateConnectorFn; uid?: string }[] = [];
    for (const { info, provider } of announced) {
      const existing = connectors.find((x) => x.id === info.rdns && x.type === "injected");
      const connector = existing ?? injected({ target: { id: info.rdns, name: info.name, icon: info.icon, provider } });
      rows.push({ key: info.uuid, name: info.name, icon: info.icon, connector, uid: existing?.uid });
    }
    // An old-style wallet that injected window.ethereum without announcing.
    const generic = connectors.find((c) => c.id === "injected");
    if (rows.length === 0 && hasEth && generic) rows.push({ key: "injected", name: "Browser wallet", connector: generic, uid: generic.uid });
    return rows;
  }, [announced, connectors, hasEth]);
  const installedRdns = new Set(announced.map((d) => d.info.rdns));
  const popular = WALLETS.filter((w) => !(w.rdns && installedRdns.has(w.rdns)));

  // After connecting: optionally add Robinhood Chain, then close.
  const finishing = useRef(false);
  useEffect(() => {
    if (!open || !isConnected || finishing.current) return;
    finishing.current = true;
    (async () => {
      if (addAfter && active) {
        setChainNote("Adding Robinhood Chain in your wallet…");
        const provider = (await active.getProvider()) as Eip1193Provider;
        const r = await addRobinhoodChain(provider);
        setChainNote(r.message);
        if (!r.ok) {
          finishing.current = false;
          return;
        }
      }
      onClose();
      finishing.current = false;
    })();
  }, [open, isConnected, addAfter, active, onClose]);

  const connectWith = useCallback(
    async (c: Connector | CreateConnectorFn) => {
      setError(null);
      try {
        await connectAsync({ connector: c });
      } catch (e) {
        setError(isUserRejection(e) ? "Cancelled in wallet" : ((e as { shortMessage?: string; message?: string }).shortMessage ?? (e as Error).message ?? "Could not connect."));
        setView({ kind: "list" });
      }
    },
    [connectAsync],
  );

  /** WalletConnect: show our QR (desktop) or deep-link into the chosen wallet app (mobile). */
  const startWalletConnect = useCallback(
    async (w?: WalletConfig) => {
      if (!wc) return;
      setView({ kind: "qr", uri: null, wallet: w });
      wcUnsub.current?.();
      const onMessage = async ({ type, data }: { type: string; data?: unknown }) => {
        if (type !== "display_uri" || typeof data !== "string") return;
        setView({ kind: "qr", uri: data, wallet: w });
        if (w && isMobileDevice()) {
          const link = await walletConnectDeepLink(w, data);
          if (link) window.location.href = link;
        }
      };
      wc.emitter.on("message", onMessage);
      wcUnsub.current = () => wc.emitter.off("message", onMessage);
      await connectWith(wc);
    },
    [wc, connectWith],
  );

  const pickPopular = async (w: WalletConfig) => {
    setError(null);
    if (w.sdk === "coinbase" && coinbaseSdk) return connectWith(coinbaseSdk);
    if (mobile) {
      if (w.sdk === "metamask" && metaMaskSdk) return connectWith(metaMaskSdk);
      if (wc) return startWalletConnect(w);
      const os = mobileOs();
      window.open((os === "ios" && w.install.ios) || (os === "android" && w.install.android) || w.install.page, "_blank", "noopener,noreferrer");
      return;
    }
    if (w.walletConnectOnly && wc) return startWalletConnect(w);
    window.open(w.install.chrome ?? w.install.page, "_blank", "noopener,noreferrer");
    setOpened((s) => new Set(s).add(w.id));
  };

  const pendingId = isPending && variables?.connector && "uid" in variables.connector ? variables.connector.uid : null;

  const addBox = (
    <div className="mb-6 rounded-sm border border-line-1 bg-surface-1 p-3">
      <p className="mb-3 text-xs text-ink-3">New to Robinhood Chain? Your wallet needs the network once.</p>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setAddAfter(true);
          if (installed.length === 1) void connectWith(installed[0].connector);
          else setChainNote(installed.length > 1 ? "Pick your wallet below; Robinhood Chain is added right after it connects." : "Connect a wallet below; Robinhood Chain is added right after it connects.");
        }}
      >
        Add Robinhood Chain to wallet
      </Button>
      {chainNote && (
        <p className="mt-2 text-xs text-ink-2" role="status">
          {chainNote}
        </p>
      )}
      <AddNetworkManual className="mt-2" />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={view.kind === "qr" ? "Scan with your phone" : "Connect wallet"}>
      {view.kind === "qr" ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              wcUnsub.current?.();
              reset();
              setView({ kind: "list" });
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-sm text-sm text-ink-2 hover:text-ink-1"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            All wallets
          </button>
          {view.wallet && <p className="text-sm text-ink-2">{`Open ${view.wallet.name} and scan, or approve the request it shows.`}</p>}
          <WalletConnectQr uri={view.uri} />
        </div>
      ) : (
        <>
          {addBox}
          <p className="text-sm text-ink-2">
            Reuno never asks for or holds a private key. Your wallet signs every transaction on {CHAIN.name} (chain id {CHAIN.id}).
          </p>

          {installed.length > 0 ? (
            <Section title="installed">
              {installed.map((row) => {
                return (
                  <li key={row.key}>
                    <button type="button" disabled={isPending} onClick={() => connectWith(row.connector)} className={rowClass}>
                      <WalletLogo src={row.icon} name={row.name} />
                      <span className="flex-1 text-sm font-medium">{row.name}</span>
                      {row.uid && pendingId === row.uid ? (
                        <Loader2 className="h-4 w-4 animate-spin text-brand-300" strokeWidth={1.75} aria-hidden="true" />
                      ) : (
                        <span className="text-mono-label inline-flex items-center gap-1.5 rounded-full border border-line-2 px-2 py-0.5 text-ink-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden="true" />
                          installed
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </Section>
          ) : (
            <p className="mt-5 text-xs text-ink-3">No browser wallet detected — pick one below or scan with your phone.</p>
          )}

          <Section title="popular">
            {popular.map((w) => {
              const viaSdk = w.sdk === "coinbase" || (mobile && w.sdk === "metamask");
              const sdkConn = w.sdk === "coinbase" ? coinbaseSdk : metaMaskSdk;
              const hint = viaSdk
                ? w.sdk === "coinbase"
                  ? "Extension, Smart Wallet or mobile app"
                  : "Opens the MetaMask app"
                : mobile
                  ? wc
                    ? "Opens the app"
                    : "Get the app"
                  : w.walletConnectOnly
                    ? wc
                      ? "Connect with WalletConnect"
                      : "Get the app"
                    : "Install extension";
              return (
                <li key={w.id}>
                  <button type="button" disabled={isPending} onClick={() => pickPopular(w)} className={rowClass}>
                    <WalletLogo src={w.logo} name={w.name} />
                    <span className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{w.name}</span>
                      <span className="text-xs text-ink-3">{hint}</span>
                    </span>
                    {viaSdk && sdkConn && pendingId === sdkConn.uid ? (
                      <Loader2 className="h-4 w-4 animate-spin text-brand-300" strokeWidth={1.75} aria-hidden="true" />
                    ) : viaSdk || (w.walletConnectOnly && wc) || (mobile && wc) ? (
                      <ChevronRight className="h-4 w-4 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <ExternalLink className="h-4 w-4 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
                    )}
                  </button>
                  {opened.has(w.id) && (
                    <p className="mt-1.5 px-1 text-xs text-ink-3">
                      Installed it?{" "}
                      <button type="button" className="text-brand-300 underline-offset-4 hover:underline" onClick={() => window.location.reload()}>
                        Refresh to connect
                      </button>
                    </p>
                  )}
                </li>
              );
            })}
            {wc && (
              <li>
                <button type="button" disabled={isPending} onClick={() => startWalletConnect()} className={rowClass}>
                  <WalletLogo src={WALLETCONNECT_LOGO} name="WalletConnect" />
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">WalletConnect</span>
                    <span className="text-xs text-ink-3">Scan a QR code with any mobile wallet</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </li>
            )}
          </Section>
        </>
      )}
      {error && (
        <p className={cn("mt-4 text-sm", error === "Cancelled in wallet" ? "text-ink-2" : "text-bad")} role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-mono-label mb-2 text-ink-3">{title}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

/** Back-compat name used across the app. */
export const ConnectWalletModal = WalletModal;
