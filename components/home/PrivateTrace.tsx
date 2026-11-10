"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Section, SectionHeading } from "@/components/layout/Section";
import { CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { RollingDigits } from "@/components/ui/RollingDigits";
import { TRACE_DEMO } from "@/data/layers";
import { EASE } from "@/lib/motion";
import { FLAGS } from "@/config/flags";

const TRACE_STAGES = [
  { name: "fresh vault", what: "when your deposit landed in a single-use wallet" },
  { name: "shard split", what: "how many shards your amount became" },
  { name: "batch + zk pool", what: "how long the shards waited with everyone else's" },
  { name: "relay exit", what: "when the relayer's delayed payout fires" },
];

/** Static explanation shown until the pool indexer is live (no numbers). */
function PrivateTraceStatic() {
  return (
    <Section tone="odd" labelledBy="trace-title">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            id="trace-title"
            eyebrow="your private trace"
            title="See every layer do its job."
            sub="Each transfer keeps a trace only you can open: which layers ran, how long each took and when the exit fires."
          />
        </div>
        <div className="card p-5 md:p-6 lg:col-span-7">
          <CardHeader left="what your trace records" right={<Pill dot="brand">opens with the pool</Pill>} />
          <ol className="mt-6 flex flex-col gap-4">
            {TRACE_STAGES.map((s, i) => (
              <li key={s.name} className="grid grid-cols-[28px_1fr] items-start gap-4">
                <span className="mono-num flex h-7 w-7 items-center justify-center rounded-full border border-line-2 text-xs text-brand-200">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-ink-1">{s.name}</span>
                  <span className="text-sm text-ink-2">{s.what}</span>
                  <span aria-hidden="true" className="mt-1 block h-2 w-full rounded-full bg-surface-3" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

export function PrivateTrace() {
  return FLAGS.traceTimeline ? <PrivateTraceTimeline /> : <PrivateTraceStatic />;
}

/** Live timeline. Rendered only when FLAGS.traceTimeline is on — wire to the pool indexer first. */
function PrivateTraceTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();
  const { total, ticks, steps } = TRACE_DEMO;

  return (
    <Section tone="odd" labelledBy="trace-title">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            id="trace-title"
            eyebrow="your private trace"
            title="See every layer do its job."
            sub="Each transfer keeps a trace only you can open: which layers ran, how long each took and when the exit fires."
          />
        </div>
        <div ref={ref} className="card p-5 md:p-6 lg:col-span-7">
          <CardHeader left={TRACE_DEMO.title} right={<Pill dot="ok">{TRACE_DEMO.status}</Pill>} />
          <p className="sr-only">
            Timeline: fresh vault 0 to 1 minute, shard split 1 to 2 minutes, batch and zk pool 2 to 11
            minutes, relay exit 11 to 14 minutes. Demo data.
          </p>
          <div aria-hidden="true" className="mt-6 flex flex-col gap-4">
            {steps.map((s, i) => (
              <div key={s.label} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[150px_1fr] sm:items-center sm:gap-4">
                <div className="flex items-baseline justify-between gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                  <span className="text-sm text-ink-1">{s.label}</span>
                  <span className="mono-num text-xs text-ink-3">
                    <RollingDigits value={String(s.start)} /> –{" "}
                    <RollingDigits value={String(s.end)} /> min
                    {s.range.includes("delay") ? " · delay" : ""}
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-surface-3">
                  <motion.div
                    className="absolute top-0 h-full rounded-full bg-grad-brand"
                    style={{ left: `${(s.start / total) * 100}%` }}
                    initial={{ width: reduce ? `${((s.end - s.start) / total) * 100}%` : 0 }}
                    animate={inView ? { width: `${((s.end - s.start) / total) * 100}%` } : undefined}
                    transition={{ duration: reduce ? 0 : 0.9, ease: EASE, delay: reduce ? 0 : i * 0.15 }}
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] sm:gap-4">
              <span className="hidden sm:block" />
              <div className="relative h-5">
                {ticks.map((t) => (
                  <span
                    key={t}
                    className="mono-num absolute -translate-x-1/2 text-xs text-ink-3 first:translate-x-0 last:-translate-x-full"
                    style={{ left: `${(t / total) * 100}%` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
