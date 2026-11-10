"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import type { CatalogModel as Model } from "@/lib/server/catalog-types";
import { formatPerMillion } from "@/lib/format";

function CopyId({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <code className="truncate font-mono text-[13px] text-ink-1">{id}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(id);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {
            setDone(false);
          }
        }}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-ink-3 transition-colors duration-[180ms] hover:bg-surface-3 hover:text-ink-1"
        aria-label={done ? "Copied" : `Copy model ID ${id}`}
      >
        {done ? (
          <Check className="h-3.5 w-3.5 text-ok" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {done ? "Copied" : ""}
      </span>
    </span>
  );
}

const COLUMNS: Column<Model>[] = [
  {
    key: "name",
    header: "model",
    cell: (m) => (
      <span className="inline-flex items-center gap-3 text-ink-1">
        <LetterAvatar text={m.provider.toUpperCase()} />
        {m.name}
      </span>
    ),
  },
  { key: "id", header: "model id", cell: (m) => <CopyId id={m.id} /> },
  { key: "in", header: "input / 1m", align: "right", cell: (m) => <span className="mono-num">{formatPerMillion(m.input)}</span> },
  { key: "out", header: "output / 1m", align: "right", cell: (m) => <span className="mono-num">{formatPerMillion(m.output)}</span> },
];

export function ModelsTableView({ rows, className }: { rows: Model[]; className?: string }) {
  return <Table className={className} columns={COLUMNS} rows={rows} rowKey={(m) => m.id} caption="AI models available with one Reuno key" />;
}
