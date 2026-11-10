"use client";

import { Check, ChevronDown, Copy } from "lucide-react";
import { useId, useState } from "react";
import { ADD_CHAIN_PARAMS, CHAIN } from "@/config/chain";
import { cn } from "@/lib/cn";

const FIELDS = [
  { label: "Network name", value: CHAIN.name },
  { label: "RPC URL", value: ADD_CHAIN_PARAMS.rpcUrls[0] },
  { label: "Chain ID", value: String(CHAIN.id) },
  { label: "Currency symbol", value: CHAIN.nativeCurrency.symbol },
  { label: "Block explorer URL", value: ADD_CHAIN_PARAMS.blockExplorerUrls[0] },
];

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex items-center gap-3 py-2">
      <dt className="w-28 shrink-0 text-xs text-ink-3 sm:w-36">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-1">
        <code className="mono-num min-w-0 flex-1 truncate text-xs text-ink-1" title={value}>
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-ink-2 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-ink-1"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-ok" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </dd>
    </div>
  );
}

/** Collapsible network settings for wallets that block programmatic adds. */
export function AddNetworkManual({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-sm text-xs text-ink-3 transition-colors duration-[180ms] hover:text-ink-1"
      >
        Add manually
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-[180ms] motion-reduce:transition-none", open && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
      {open && (
        <dl id={id} className="mt-2 divide-y divide-line-1 rounded-sm border border-line-1 bg-surface-1 px-3">
          {FIELDS.map((f) => (
            <CopyRow key={f.label} {...f} />
          ))}
        </dl>
      )}
    </div>
  );
}
