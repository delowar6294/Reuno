"use client";

import { ChevronDown, Copy, ExternalLink, LogOut, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useBalance, useDisconnect, useReadContracts } from "wagmi";
import { Button } from "@/components/ui/Button";
import { ConnectWalletModal } from "@/components/trade/ConnectWalletModal";
import { CHAIN, explorerAddressUrl } from "@/config/chain";
import { STOCK_TOKENS } from "@/config/tokens";
import { WALLETCONNECT_LOGO, walletById, walletByRdns } from "@/config/wallets";
import { formatEth, formatUsd, shortAddress } from "@/lib/format";
import { usePrices } from "@/lib/use-market";
import { addRobinhoodChain } from "@/lib/wallet/addNetwork";
import type { Eip1193Provider } from "@/lib/wallet/provider";
import { cn } from "@/lib/cn";
import { AddChainButton } from "./AddChainButton";
import { WalletLogo } from "./WalletLogo";
import { AddTokenButton } from "./AddTokenButton";
import { useBridge } from "./BridgeProvider";

/** Official logo of the connected wallet: its EIP-6963 icon, else our saved official file. */
function connectorLogo(c: { id: string; icon?: string; type: string } | undefined): string | undefined {
  if (!c) return undefined;
  if (c.icon) return c.icon;
  if (c.id === "coinbaseWalletSDK") return walletById("coinbase")?.logo;
  if (c.id === "metaMaskSDK") return walletById("metamask")?.logo;
  if (c.type === "walletConnect") return WALLETCONNECT_LOGO;
  return walletByRdns(c.id)?.logo;
}

/** Wallet button: Connect → Switch to Robinhood Chain → address + ETH balance with an account menu. */
export function ConnectButton({ className }: { className?: string }) {
  const { address, isConnected, chainId, connector } = useAccount();
  const [connectOpen, setConnectOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bridge = useBridge();
  const [switching, setSwitching] = useState(false);
  const [switchMsg, setSwitchMsg] = useState<string | null>(null);
  const eth = useBalance({ address, chainId: CHAIN.id, query: { enabled: !!address } });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (!isConnected || !address) {
    return (
      <>
        <Button size="sm" className={className} onClick={() => setConnectOpen(true)}>
          Connect wallet
        </Button>
        <ConnectWalletModal open={connectOpen} onClose={() => setConnectOpen(false)} />
      </>
    );
  }

  if (chainId !== CHAIN.id) {
    const doSwitch = async () => {
      setSwitching(true);
      setSwitchMsg(null);
      const provider = connector ? ((await connector.getProvider()) as Eip1193Provider) : null;
      const r = await addRobinhoodChain(provider);
      setSwitching(false);
      if (!r.ok) setSwitchMsg(r.message);
    };
    return (
      <div className={cn("flex flex-col items-end gap-1", className)}>
        <Button size="sm" loading={switching} onClick={doSwitch}>
          Switch to Robinhood Chain
        </Button>
        {switchMsg && (
          <span className="text-xs text-ink-3" role="status">
            {switchMsg}
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line-2 bg-surface-1 px-3 text-sm text-ink-1 transition-colors duration-[180ms] hover:border-line-3 hover:bg-surface-2"
      >
        <WalletLogo src={connectorLogo(connector)} name={connector?.name ?? "Wallet"} size="sm" />
        <span className="mono-num">{shortAddress(address)}</span>
        <span className="mono-num hidden text-ink-3 sm:inline">
          {eth.data ? `${formatEth(eth.data.value)} ETH` : "…"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {menuOpen && (
        <AccountMenu
          address={address}
          onClose={() => setMenuOpen(false)}
          onGetEth={() => {
            setMenuOpen(false);
            bridge?.openBridge();
          }}
        />
      )}
    </div>
  );
}

function AccountMenu({ address, onClose, onGetEth }: { address: `0x${string}`; onClose: () => void; onGetEth: () => void }) {
  const { disconnect } = useDisconnect();
  const eth = useBalance({ address, chainId: CHAIN.id });
  const prices = usePrices();
  const [copied, setCopied] = useState(false);

  const balances = useReadContracts({
    contracts: STOCK_TOKENS.map((t) => ({
      address: t.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address] as const,
      chainId: CHAIN.id,
    })),
  });

  const decimals = useReadContracts({
    contracts: STOCK_TOKENS.map((t) => ({ address: t.address, abi: erc20Abi, functionName: "decimals" as const, chainId: CHAIN.id })),
    query: { staleTime: Infinity },
  });

  const rows = STOCK_TOKENS.map((t, i) => {
    const r = balances.data?.[i];
    const d = decimals.data?.[i];
    const raw = r?.status === "success" ? (r.result as bigint) : null;
    const dec = d?.status === "success" ? Number(d.result) : null;
    return { token: t, raw, dec };
  }).filter((r) => r.raw !== null && r.dec !== null && r.raw > BigInt(0));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Wallet"
      className="absolute right-0 top-full z-40 mt-2 flex w-[min(360px,calc(100vw-32px))] flex-col gap-4 rounded-lg border border-line-2 bg-surface-1 p-4 shadow-glow-brand"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="mono-num text-sm text-ink-1">{shortAddress(address, 8, 6)}</span>
        <span className="flex gap-1">
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Address copied" : "Copy address"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-2 hover:text-ink-1"
          >
            {copied ? <Check className="h-4 w-4 text-ok" strokeWidth={1.75} aria-hidden="true" /> : <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
          </button>
          <a
            href={explorerAddressUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View address on the Robinhood Chain explorer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-2 hover:text-ink-1"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </a>
        </span>
      </div>

      <div className="flex items-center justify-between rounded-sm border border-line-1 bg-surface-2 px-3 py-2">
        <span className="text-xs text-ink-3">ETH on Robinhood Chain</span>
        <span className="mono-num text-sm text-ink-1">{eth.data ? formatEth(eth.data.value) : "…"}</span>
      </div>
      <Button size="sm" variant="secondary" onClick={onGetEth}>
        Get ETH on Robinhood Chain
      </Button>

      <div className="flex flex-col gap-2">
        <span className="text-mono-label text-ink-3">stock tokens</span>
        {balances.isLoading || decimals.isLoading ? (
          <span className="block h-3 w-32 rounded-sm bg-surface-3 motion-safe:animate-pulse" aria-label="Loading balances" />
        ) : balances.isError ? (
          <span className="text-xs text-ink-3">Balances unavailable right now.</span>
        ) : rows.length === 0 ? (
          <span className="text-xs text-ink-3">No stock tokens in this wallet yet.</span>
        ) : (
          <ul className="flex flex-col divide-y divide-line-1">
            {rows.map(({ token, raw, dec }) => {
              const amount = Number(formatUnits(raw!, dec!));
              const price = prices.data?.prices.find((p) => p.ticker === token.ticker)?.priceUsd;
              return (
                <li key={token.ticker} className="flex items-center justify-between gap-2 py-2">
                  <span className="flex flex-col">
                    <span className="mono-num text-sm text-ink-1">{token.ticker}</span>
                    <span className="mono-num text-xs text-ink-3">
                      {amount.toLocaleString("en-US", { maximumSignificantDigits: 6 })}
                      {price !== undefined && ` · ${formatUsd(amount * price)}`}
                    </span>
                  </span>
                  <AddTokenButton address={token.address} symbol={token.ticker} />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-line-1 pt-4">
        <AddChainButton />
      </div>

      <button
        type="button"
        onClick={() => {
          disconnect();
          onClose();
        }}
        className="inline-flex items-center gap-2 self-start rounded-sm text-sm text-ink-2 hover:text-ink-1"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Disconnect
      </button>
    </div>
  );
}
