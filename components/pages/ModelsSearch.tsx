"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ModelsTableView } from "@/components/home/ModelsTableView";
import { MODELS, MODELS_CAPTION } from "@/data/models";

export function ModelsSearch() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MODELS;
    return MODELS.filter((m) => m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s));
  }, [q]);

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
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or ID"
          className="h-11 w-full rounded-sm border border-line-1 bg-surface-3 pl-9 pr-3 text-sm text-ink-1 placeholder:text-ink-3 transition-colors duration-[180ms] hover:border-line-2 focus:border-line-3 focus:outline-none"
        />
      </div>
      <p className="text-mono-label text-ink-3" aria-live="polite">
        {rows.length} of {MODELS.length} models
      </p>
      {rows.length ? (
        <ModelsTableView rows={rows} />
      ) : (
        <div className="card p-8 text-center text-ink-2">No model matches that search.</div>
      )}
      <p className="text-xs text-ink-3">{MODELS_CAPTION}</p>
    </div>
  );
}
