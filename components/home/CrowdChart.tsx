"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Section, SectionHeading } from "@/components/layout/Section";
import { CardHeader } from "@/components/ui/Card";
import { WEEKLY_DEPOSITS } from "@/data/poolActivity";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { FLAGS } from "@/config/flags";
import { Pill } from "@/components/ui/Pill";

/** Static explanation (no numbers) until the pool indexer is live. */
function CrowdStatic() {
  // A purely illustrative crowd: one highlighted dot among many, no data implied.
  const dots = Array.from({ length: 84 }, (_, i) => i);
  return (
    <Section tone="even" labelledBy="crowd-title">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            id="crowd-title"
            eyebrow="a crowd that grows"
            title="More people, more cover."
            sub="Your funds mix with every other deposit in the pool. The more it's used, the harder any one transfer is to pick out."
          />
        </div>
        <div className="card p-5 md:p-6 lg:col-span-7">
          <CardHeader left="your deposit in the crowd" right={<Pill dot="brand">live stats at launch</Pill>} />
          <div aria-hidden="true" className="mt-6 grid grid-cols-12 gap-2.5 sm:gap-3">
            {dots.map((i) => (
              <span
                key={i}
                className={cn(
                  "aspect-square rounded-full",
                  i === 45 ? "bg-brand-300 shadow-glow-brand" : "bg-surface-3",
                )}
              />
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-2">
            One deposit among many looks like any other. Pool size and daily deposits appear here once the pool is live.
          </p>
        </div>
      </div>
    </Section>
  );
}

export function CrowdChart() {
  return FLAGS.crowdChart ? <CrowdChartLive /> : <CrowdStatic />;
}

/** Rendered only when FLAGS.crowdChart is on — wire to the pool indexer first. */
function CrowdChartLive() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();
  const max = Math.max(...WEEKLY_DEPOSITS.map((d) => d.deposits));

  return (
    <Section tone="even" labelledBy="crowd-title">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            id="crowd-title"
            eyebrow="a crowd that grows"
            title="More people, more cover."
            sub="Your funds mix with every other deposit in the pool. The more it's used, the harder any one transfer is to pick out."
          />
        </div>
        <div ref={ref} className="card p-5 md:p-6 lg:col-span-7">
          <CardHeader
            left="pool deposits per day"
            right={<span className="text-mono-label text-brand-300">demo data</span>}
          />
          <p className="sr-only">
            Bar chart, demo data: deposits rise through the week from{" "}
            {WEEKLY_DEPOSITS[0].deposits} on Monday to {WEEKLY_DEPOSITS.at(-1)?.deposits} on Sunday.
          </p>
          <div aria-hidden="true" className="mt-6 flex h-56 items-end gap-2 sm:gap-4">
            {WEEKLY_DEPOSITS.map((d, i) => {
              const last = i === WEEKLY_DEPOSITS.length - 1;
              const h = `${(d.deposits / max) * 100}%`;
              return (
                <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="mono-num text-xs text-ink-3">{d.deposits}</span>
                  <motion.div
                    className={cn(
                      "w-full rounded-t-sm",
                      last ? "bg-brand-200" : "bg-gradient-to-t from-brand-800 to-brand-400",
                    )}
                    initial={{ height: reduce ? h : 0 }}
                    animate={inView ? { height: h } : undefined}
                    transition={{ duration: reduce ? 0 : 0.8, ease: EASE, delay: reduce ? 0 : i * 0.06 }}
                  />
                  <span className="text-mono-label text-ink-3">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
