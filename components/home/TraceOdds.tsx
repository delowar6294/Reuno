"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Section, SectionHeading } from "@/components/layout/Section";
import { StatusDot } from "@/components/ui/StatusDot";
import { TRACE_ODDS } from "@/data/layers";
import { EASE } from "@/lib/motion";
import { FLAGS } from "@/config/flags";
import { LAYERS } from "@/data/layers";

/** Static explanation (no percentages) until audited measurements exist. */
function TraceOddsStatic() {
  return (
    <Section tone="even" labelledBy="odds-title">
      <SectionHeading id="odds-title" eyebrow="traceability, layer by layer" title="Each layer cuts the odds." />
      <div className="card mt-12 p-5 md:p-8">
        <ol className="flex flex-col divide-y divide-line-1">
          {LAYERS.map((l) => (
            <li key={l.code} className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-1 py-4 first:pt-0 last:pb-0 md:grid-cols-[80px_160px_1fr]">
              <span className="text-mono-label text-ink-3">layer {l.n}</span>
              <span className="text-sm text-ink-1">{l.name}</span>
              <span className="col-span-2 text-sm text-ink-2 md:col-span-1">breaks {l.defeats}</span>
            </li>
          ))}
        </ol>
        <p className="text-mono-label mt-8 flex items-start gap-2 text-ink-2">
          <StatusDot tone="brand" className="mt-1" />
          measured traceability figures will be published after the audit.
        </p>
      </div>
    </Section>
  );
}

export function TraceOdds() {
  return FLAGS.traceOdds ? <TraceOddsLive /> : <TraceOddsStatic />;
}

/** Rendered only when FLAGS.traceOdds is on — replace TRACE_ODDS with audited figures first. */
function TraceOddsLive() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  return (
    <Section tone="even" labelledBy="odds-title">
      <SectionHeading id="odds-title" eyebrow="traceability, layer by layer" title="Each layer cuts the odds." />
      <div ref={ref} className="card mt-12 p-5 md:p-8">
        <ol className="flex flex-col gap-5">
          {TRACE_ODDS.map((r, i) => (
            <li
              key={r.n}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[80px_140px_1fr_96px]"
              style={{ paddingLeft: `min(${i * 3}%, ${i * 24}px)` }}
            >
              <span className="text-mono-label text-ink-3 md:order-none">layer {r.n}</span>
              <span className="mono-num text-right text-sm text-silver-200 md:order-last">{r.value}</span>
              <span className="text-sm text-ink-1 md:order-none">{r.name}</span>
              <div className="col-span-2 h-2 rounded-full bg-surface-3 md:col-span-1">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-800 to-brand-400"
                  initial={{ width: reduce ? `${r.pct}%` : 0 }}
                  animate={inView ? { width: `${Math.max(r.pct, 0.8)}%` } : undefined}
                  transition={{ duration: reduce ? 0 : 0.8, ease: EASE, delay: reduce ? 0 : i * 0.12 }}
                />
              </div>
            </li>
          ))}
        </ol>
        <p className="text-mono-label mt-8 flex items-start gap-2 text-ink-2">
          <StatusDot tone="warn" className="mt-1" />
          design targets, illustrative model — measured figures published after audit.
        </p>
      </div>
    </Section>
  );
}
