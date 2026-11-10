"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { middleTruncate } from "@/lib/format";

export function CopyField({
  value,
  label,
  note,
  max = 34,
  className,
}: {
  value: string;
  label?: string;
  note?: string;
  max?: number;
  className?: string;
}) {
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || note) && (
        <div className="flex items-center justify-between gap-3">
          {label && <span className="text-mono-label text-ink-3">{label}</span>}
          {note && <span className="text-mono-label text-brand-300">{note}</span>}
        </div>
      )}
      <div className="flex h-11 items-center gap-2 rounded-sm border border-line-1 bg-surface-3 pl-3 pr-1">
        <code className="mono-num min-w-0 flex-1 truncate text-sm text-ink-1" title={value}>
          {middleTruncate(value, max)}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink-2 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-ink-1"
          aria-label={copied ? "Copied" : `Copy ${label ?? "value"}`}
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
      </div>
    </div>
  );
}
