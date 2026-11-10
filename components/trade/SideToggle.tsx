"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useRef } from "react";
import type { TradeSide } from "@/lib/market-types";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

const SIDES: { id: TradeSide; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
];

export function SideToggle({ value, onChange }: { value: TradeSide; onChange: (s: TradeSide) => void }) {
  const group = useId();
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <div role="tablist" aria-label="Trade side" className="grid h-11 grid-cols-2 rounded-md bg-surface-3 p-1">
      {SIDES.map((s, i) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(s.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                const next = SIDES[(i + 1) % 2];
                onChange(next.id);
                refs.current[(i + 1) % 2]?.focus();
              }
            }}
            className={cn(
              "relative rounded-sm text-sm font-medium transition-colors duration-[180ms]",
              active ? (s.id === "buy" ? "text-ink-inverse" : "text-ink-1") : "text-ink-2 hover:text-ink-1",
            )}
          >
            {active && (
              <motion.span
                layoutId={`side-pill-${group}`}
                transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}
                className={cn(
                  "absolute inset-0 rounded-sm",
                  s.id === "buy" ? "bg-grad-brand" : "border border-line-3 bg-surface-2",
                )}
              />
            )}
            <span className="relative">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
