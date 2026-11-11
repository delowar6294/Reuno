"use client";

import { Settings2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const PRESETS = [10, 50, 100]; // bps: 0.1%, 0.5%, 1%
const KEY = "reuno.slippageBps";

/** Slippage tolerance in basis points, remembered per browser (falls back to 0.5%). */
export function useSlippage(): [number, (bps: number) => void] {
  const [bps, setBps] = useState(50);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(KEY));
      if (Number.isInteger(v) && v >= 1 && v <= 1000) setBps(v);
    } catch {
      // storage unavailable: keep the default
    }
  }, []);
  const set = (v: number) => {
    setBps(v);
    try {
      localStorage.setItem(KEY, String(v));
    } catch {
      // ignore
    }
  };
  return [bps, set];
}

export function SlippageSettings({ bps, onChange, disabled }: { bps: number; onChange: (bps: number) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(PRESETS.includes(bps) ? "" : String(bps / 100));
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const customErr = custom !== "" && (!/^\d{1,2}(\.\d{1,2})?$/.test(custom) || Number(custom) < 0.01 || Number(custom) > 10);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={`Swap settings, slippage ${bps / 100}%`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line-2 px-2.5 text-xs text-ink-2 transition-colors duration-[180ms] hover:border-line-3 hover:text-ink-1 disabled:opacity-50"
      >
        <Settings2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        <span className="mono-num">{bps / 100}%</span>
      </button>
      {open && (
        <div id={id} role="dialog" aria-label="Slippage tolerance" className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-line-2 bg-surface-1 p-4">
          <p className="text-mono-label text-ink-3">max slippage</p>
          <div className="mt-3 flex gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(p);
                  setCustom("");
                }}
                aria-pressed={bps === p}
                className={cn(
                  "mono-num h-8 flex-1 rounded-full border text-xs transition-colors duration-[180ms]",
                  bps === p ? "border-brand-400 text-brand-200" : "border-line-2 text-ink-2 hover:text-ink-1",
                )}
              >
                {p / 100}%
              </button>
            ))}
          </div>
          <label className="mt-3 flex h-9 items-center gap-2 rounded-sm border border-line-1 bg-surface-3 px-2.5 focus-within:border-line-3">
            <span className="sr-only">Custom slippage percent</span>
            <input
              inputMode="decimal"
              placeholder="Custom"
              value={custom}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                setCustom(v);
                if (/^\d{1,2}(\.\d{1,2})?$/.test(v) && Number(v) >= 0.01 && Number(v) <= 10) onChange(Math.round(Number(v) * 100));
              }}
              className="mono-num min-w-0 flex-1 bg-transparent text-sm text-ink-1 outline-none placeholder:text-ink-3"
            />
            <span className="text-xs text-ink-3">%</span>
          </label>
          {customErr && <p className="mt-2 text-xs text-bad">Use 0.01% to 10%.</p>}
          {bps > 100 && !customErr && <p className="mt-2 text-xs text-warn">High slippage: you may receive noticeably less.</p>}
        </div>
      )}
    </div>
  );
}
