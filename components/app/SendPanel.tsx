"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi, formatUnits, getAddress, isAddress, parseUnits } from "viem";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { Button } from "@/components/ui/Button";
import { AddTokenButton } from "@/components/wallet/AddTokenButton";
import { GasNotice } from "@/components/wallet/GasNotice";
import { TxStatus } from "@/components/wallet/TxStatus";
import { WalletGate } from "@/components/wallet/WalletGate";
import { CHAIN } from "@/config/chain";
import { STOCK_TOKENS } from "@/config/tokens";
import { formatEth } from "@/lib/format";
import type { TxCall } from "@/lib/wallet/tx";
import { usePreflight, useTxRunner } from "@/lib/wallet/useTx";
import { cn } from "@/lib/cn";
import { Field, inputClass, TokenSelect } from "./fields";

const ETH = "ETH";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Standard (public) transfer of ETH or a stock token on Robinhood Chain, signed in the user's wallet. */
export function SendPanel() {
  const { address } = useAccount();
  const [asset, setAsset] = useState(ETH);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState({ to: false, amount: false });

  const token = asset === ETH ? null : STOCK_TOKENS.find((t) => t.ticker === asset)!;
  const ethBal = useBalance({ address, chainId: CHAIN.id, query: { enabled: !!address } });
  const tokenReads = useReadContracts({
    contracts: token && address
      ? [
          { address: token.address, abi: erc20Abi, functionName: "decimals", chainId: CHAIN.id },
          { address: token.address, abi: erc20Abi, functionName: "balanceOf", args: [address], chainId: CHAIN.id },
        ]
      : [],
    query: { enabled: !!token && !!address },
  });

  const decimals = token ? (tokenReads.data?.[0]?.status === "success" ? Number(tokenReads.data[0].result) : null) : 18;
  const balance = token
    ? tokenReads.data?.[1]?.status === "success"
      ? (tokenReads.data[1].result as bigint)
      : null
    : (ethBal.data?.value ?? null);

  const toErr = to.trim() === "" ? "Enter a recipient address." : !isAddress(to.trim(), { strict: false }) ? "That is not a valid address." : null;
  const amountErr = useMemo(() => {
    if (amount.trim() === "") return "Enter an amount.";
    if (decimals === null) return "Reading token decimals…";
    const re = new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`);
    if (!re.test(amount)) return `Use a positive number with at most ${decimals} decimals.`;
    const raw = parseUnits(amount, decimals);
    if (raw <= BigInt(0)) return `Minimum is 1e-${decimals} ${asset}.`;
    if (balance !== null && raw > balance) return `You have ${formatUnits(balance, decimals)} ${asset}.`;
    return null;
  }, [amount, decimals, balance, asset]);

  const debTo = useDebounced(to.trim(), 400);
  const debAmount = useDebounced(amount, 400);
  const runner = useTxRunner(token?.ticker);

  const call: TxCall | null = useMemo(() => {
    if (toErr || amountErr || decimals === null || runner.state.phase === "success") return null;
    if (debTo !== to.trim() || debAmount !== amount) return null;
    const recipient = getAddress(debTo);
    const raw = parseUnits(debAmount, decimals);
    return token
      ? { kind: "erc20", token: token.address, functionName: "transfer", args: [recipient, raw] }
      : { kind: "raw", to: recipient, value: raw };
  }, [toErr, amountErr, decimals, debTo, debAmount, to, amount, token, runner.state.phase]);

  const { preflight } = usePreflight(call, token?.ticker);
  const done = runner.state.phase === "success";

  const reset = () => {
    runner.reset();
    setAmount("");
    setTouched({ to: false, amount: false });
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-2">
        Standard transfer, public on Robinhood Chain: anyone can see the sender, recipient and amount. Private transfers open
        with the Reuno pool.
      </p>

      <Field
        label="asset"
        htmlFor="send-asset"
        hint={token ? (decimals !== null ? `${decimals} decimals · read on-chain` : "Reading decimals…") : "Native ETH · 18 decimals"}
      >
        <div className="flex items-center gap-2">
          <TokenSelect
            id="send-asset"
            value={asset}
            onChange={(v) => {
              setAsset(v);
              setAmount("");
              runner.reset();
            }}
            options={[ETH, ...STOCK_TOKENS.map((t) => t.ticker)]}
            className="flex-1"
          />
          {token && <AddTokenButton address={token.address} symbol={token.ticker} />}
        </div>
      </Field>

      <Field label="recipient" htmlFor="send-to" error={touched.to && toErr ? toErr : undefined}>
        <input
          id="send-to"
          value={to}
          disabled={runner.busy}
          onChange={(e) => {
            setTo(e.target.value);
            if (done) runner.reset();
          }}
          onBlur={() => setTouched((t) => ({ ...t, to: true }))}
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={touched.to && toErr ? true : undefined}
          aria-describedby={touched.to && toErr ? "send-to-error" : undefined}
          className={cn(inputClass, "mono-num text-sm", touched.to && toErr && "border-bad")}
        />
      </Field>

      <Field
        label={`amount (${asset})`}
        htmlFor="send-amount"
        error={touched.amount && amountErr ? amountErr : undefined}
        hint={balance !== null && decimals !== null ? `Balance: ${token ? formatUnits(balance, decimals) : formatEth(balance)} ${asset}` : undefined}
      >
        <div className="flex items-center gap-2">
          <input
            id="send-amount"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            disabled={runner.busy}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^0-9.]/g, ""));
              if (done) runner.reset();
            }}
            onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
            placeholder="0.0"
            aria-invalid={touched.amount && amountErr ? true : undefined}
            aria-describedby={touched.amount && amountErr ? "send-amount-error" : undefined}
            className={cn(inputClass, "mono-num flex-1", touched.amount && amountErr && "border-bad")}
          />
          {token && balance !== null && decimals !== null && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setAmount(formatUnits(balance, decimals));
                setTouched((t) => ({ ...t, amount: true }));
              }}
            >
              Max
            </Button>
          )}
        </div>
      </Field>

      <WalletGate>
        <div className="flex flex-col gap-3">
          {runner.state.phase === "idle" && call && (
            <>
              {preflight.status === "checking" && (
                <p className="flex items-center gap-2 text-xs text-ink-3" role="status">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                  Simulating the transfer on Robinhood Chain…
                </p>
              )}
              {(preflight.status === "revert" || preflight.status === "error") && (
                <p className="text-sm text-bad" role="alert">
                  {preflight.message}
                </p>
              )}
              {preflight.status === "funds" && <GasNotice result={preflight} />}
              {preflight.status === "ok" && (
                <p className="text-xs text-ink-3" role="status">
                  Simulation passed · network gas ≈ {formatEth(preflight.gasCostWei)} ETH (max, +20% buffer)
                </p>
              )}
            </>
          )}
          <TxStatus state={runner.state} label="Transfer" />
          {done ? (
            <Button size="lg" variant="secondary" className="w-full" onClick={reset}>
              New transfer
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full"
              loading={runner.busy}
              disabled={!call || preflight.status !== "ok"}
              onClick={() => {
                setTouched({ to: true, amount: true });
                if (call) void runner.run(call);
              }}
            >
              Review &amp; send
            </Button>
          )}
        </div>
      </WalletGate>
    </div>
  );
}
