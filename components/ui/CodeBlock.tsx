"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function CodeBlock({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <div className={cn("overflow-hidden rounded-lg border border-line-1 bg-surface-1", className)}>
      <div className="flex h-11 items-center justify-between border-b border-line-1 pl-4 pr-1.5">
        <span className="text-mono-label text-ink-3">{label ?? "code"}</span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setDone(true);
              setTimeout(() => setDone(false), 1500);
            } catch {
              setDone(false);
            }
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-xs text-ink-3 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-ink-1"
          aria-label={done ? "Copied" : "Copy code"}
        >
          {done ? (
            <Check className="h-3.5 w-3.5 text-ok" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          )}
          {done ? "copied" : "copy"}
        </button>
        <span className="sr-only" aria-live="polite">
          {done ? "Copied" : ""}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-ink-1">{code}</code>
      </pre>
    </div>
  );
}
