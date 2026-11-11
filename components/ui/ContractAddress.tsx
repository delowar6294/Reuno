"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { middleTruncate } from "@/lib/format";

/** "CA: 0x…" line with a copy button. Shows the full address from sm up and a shortened one on phones. */
export function ContractAddress({ address, className }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(address);
      ok = true;
    } catch {
      // Some in-app wallet browsers block the async Clipboard API; fall back to a selected textarea.
      const ta = document.createElement("textarea");
      ta.value = address;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
    }
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 font-mono text-sm text-ink-1", className)}>
      <span className="shrink-0">CA:</span>
      <span className="mono-num min-w-0 truncate" title={address}>
        <span className="sm:hidden">{middleTruncate(address, 18)}</span>
        <span className="hidden sm:inline">{address}</span>
      </span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-ink-2 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-ink-1"
        aria-label={copied ? "Contract address copied" : "Copy contract address"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-ok" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}
