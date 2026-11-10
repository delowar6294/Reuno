"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { changeWords, formatUsd } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

const W = 400;
const H = 120;
const POINTS = 48;
const PAD = 0.12;

/** Linear resample to exactly n points so paths of different lengths morph cleanly. */
function resample(values: number[], n: number): number[] {
  if (values.length === n) return values;
  return Array.from({ length: n }, (_, i) => {
    const pos = (i / (n - 1)) * (values.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(values.length - 1, lo + 1);
    const t = pos - lo;
    return values[lo] * (1 - t) + values[hi] * t;
  });
}

/** Monotone cubic (Fritsch–Carlson) path: never overshoots the data's min/max. */
function monotonePath(xs: number[], ys: number[]): string {
  const n = xs.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    m.push((ys[i + 1] - ys[i]) / dx[i]);
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  const f = (v: number) => v.toFixed(2);
  let d = `M${f(xs[0])} ${f(ys[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${f(xs[i] + h)} ${f(ys[i] + t[i] * h)} ${f(xs[i + 1] - h)} ${f(ys[i + 1] - t[i + 1] * h)} ${f(xs[i + 1])} ${f(ys[i + 1])}`;
  }
  return d;
}

function useSecondsSince(iso: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;
  return Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
}

function agoLabel(s: number | null) {
  if (s === null) return "updated just now";
  if (s < 60) return `updated ${s}s ago`;
  return `updated ${Math.floor(s / 60)}m ago`;
}

export function Sparkline({
  series,
  times,
  ticker,
  changePct,
  updatedAt,
  hourly,
  className,
}: {
  series: number[];
  times: number[];
  ticker: string;
  changePct: number;
  updatedAt: string;
  /** true when the series is hourly candles; false when built from 5-minute price snapshots. */
  hourly: boolean;
  className?: string;
}) {
  const gradId = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const ago = useSecondsSince(updatedAt);
  const enough = series.length >= 2;

  const geom = useMemo(() => {
    if (!enough) return null;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || Math.max(Math.abs(max) * 0.01, 1e-9);
    const lo = min - span * PAD;
    const hi = max + span * PAD;
    const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
    const vals = resample(series, POINTS);
    const xs = vals.map((_, i) => (i / (POINTS - 1)) * W);
    const ys = vals.map(y);
    const line = monotonePath(xs, ys);
    return {
      y,
      line,
      area: `${line} L${W} ${H} L0 ${H} Z`,
      baseline: y(series[0]),
      endY: ys[ys.length - 1],
    };
  }, [series, enough]);

  const onMove = (e: React.PointerEvent) => {
    if (!enough || e.pointerType === "touch" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHover(Math.round(frac * (series.length - 1)));
  };

  const transition = reduce ? { duration: 0 } : { duration: 0.6, ease: EASE };
  const hv = hover !== null && geom ? { idx: hover, value: series[hover], t: times[hover] } : null;
  const isLast = hv ? hv.idx === series.length - 1 : false;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-mono-label text-ink-3">{hourly ? "24h · hourly" : "recent · 5 min"}</span>
        <span className="mono-num text-xs text-ink-3">{agoLabel(ago)}</span>
      </div>

      <div
        ref={ref}
        className="relative h-[120px] w-full"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <span className="sr-only">
          {ticker}, last 24 hours, {changeWords(changePct)}
        </span>

        {!geom ? (
          <div className="flex h-full items-center justify-center rounded-sm border border-dashed border-line-1">
            <span className="text-mono-label text-ink-3">collecting price history</span>
          </div>
        ) : (
          <>
            <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-400)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--brand-400)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line
                x1={0}
                x2={W}
                y1={geom.baseline}
                y2={geom.baseline}
                className="stroke-line-2"
                strokeWidth={1}
                strokeDasharray="3 5"
                vectorEffect="non-scaling-stroke"
              />
              <motion.path initial={false} animate={{ d: geom.area }} transition={transition} fill={`url(#${gradId})`} />
              <motion.path
                initial={false}
                animate={{ d: geom.line }}
                transition={transition}
                fill="none"
                stroke="var(--brand-400)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* End dot at the latest price (HTML so it stays round with preserveAspectRatio=none) */}
            <motion.span
              aria-hidden="true"
              className="absolute right-0 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-brand-200"
              initial={false}
              animate={{ top: `${(geom.endY / H) * 100}%` }}
              transition={transition}
            >
              <span className="absolute inset-0 rounded-full bg-brand-200 motion-safe:animate-pulse-ring" />
            </motion.span>

            {hv && (
              <>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-px bg-line-3"
                  style={{ left: `${(hv.idx / (series.length - 1)) * 100}%` }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-200 bg-bg-0"
                  style={{
                    left: `${(hv.idx / (series.length - 1)) * 100}%`,
                    top: `${(geom.y(hv.value) / H) * 100}%`,
                  }}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-sm border border-line-2 bg-surface-3 px-2 py-1 font-mono text-xs text-ink-1",
                    hv.idx / (series.length - 1) > 0.7 ? "-translate-x-full" : hv.idx / (series.length - 1) < 0.3 ? "" : "-translate-x-1/2",
                  )}
                  style={{ left: `${(hv.idx / (series.length - 1)) * 100}%` }}
                >
                  {formatUsd(hv.value)}
                  <span className="text-ink-3">
                    {" · "}
                    {isLast
                      ? "now"
                      : new Date(hv.t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
