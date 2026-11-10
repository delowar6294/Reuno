"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ModelsTableView } from "@/components/home/ModelsTableView";
import { MODELS_CAPTION } from "@/data/models";
import type { CatalogModel } from "@/lib/server/catalog-types";

const PAGE = 50;

export function ModelsSearch({ models }: { models: CatalogModel[] }) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return models;
    return models.filter((m) => m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s));
  }, [q, models]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-[420px]">
        <label htmlFor="model-search" className="sr-only">
          Search models by name or ID
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id="model-search"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search by name or ID"
          className="h-11 w-full rounded-sm border border-line-1 bg-surface-3 pl-9 pr-3 text-sm text-ink-1 placeholder:text-ink-3 transition-colors duration-[180ms] hover:border-line-2 focus:border-line-3 focus:outline-none"
        />
      </div>
      <p className="text-mono-label text-ink-3" aria-live="polite">
        {rows.length} of {models.length} models
      </p>
      {rows.length ? (
        <ModelsTableView rows={rows.slice(0, limit)} />
      ) : (
        <div className="card p-8 text-center text-ink-2">No model matches that search.</div>
      )}
      {rows.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="self-center rounded-md border border-line-2 px-5 py-2.5 text-sm text-ink-1 transition-colors duration-[180ms] hover:bg-surface-2"
        >
          Show {Math.min(PAGE, rows.length - limit)} more
        </button>
      )}
      <p className="text-xs text-ink-3">{MODELS_CAPTION}</p>
    </div>
  );
}
