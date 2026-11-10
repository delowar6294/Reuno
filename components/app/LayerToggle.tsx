"use client";

import { Lock } from "lucide-react";
import { LAYERS, type Layer } from "@/data/layers";
import { cn } from "@/lib/cn";

/** Layers 1 (fresh vault) and 5 (relay exit) are always on. */
export const LOCKED_LAYERS: Layer["n"][] = [1, 5];

export function LayerToggle({
  enabled,
  onChange,
}: {
  enabled: Layer["n"][];
  onChange: (next: Layer["n"][]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-mono-label mb-3 text-ink-3">privacy layers</legend>
      <div className="flex flex-wrap gap-2">
        {LAYERS.map((l) => {
          const on = enabled.includes(l.n);
          const locked = LOCKED_LAYERS.includes(l.n);
          return (
            <button
              key={l.code}
              type="button"
              role="switch"
              aria-checked={on}
              aria-disabled={locked || undefined}
              aria-label={`${l.name}${locked ? ", always on" : ""}`}
              onClick={() => {
                if (locked) return;
                onChange(on ? enabled.filter((n) => n !== l.n) : [...enabled, l.n].sort());
              }}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3 font-mono text-xs transition-colors duration-[180ms]",
                on
                  ? "border-brand-400 bg-surface-3 text-brand-200"
                  : "border-line-1 bg-transparent text-ink-3 hover:border-line-2",
                locked && "cursor-not-allowed",
              )}
            >
              {l.code}
              <span className="hidden sm:inline">{l.name.toLowerCase()}</span>
              {locked && <Lock className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
