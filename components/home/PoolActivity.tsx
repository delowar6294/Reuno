"use client";

import { useEffect, useState } from "react";
import { Section, SectionHeading } from "@/components/layout/Section";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { StatusDot } from "@/components/ui/StatusDot";
import { DAYS, HEATMAP, POOL_STATS } from "@/data/poolActivity";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/cn";
import { FLAGS } from "@/config/flags";

const STEPS = ["bg-surface-3", "bg-brand-900", "bg-brand-700", "bg-brand-500", "bg-brand-300"];

function useCountdown(start: number) {
  const [left, setLeft] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 1 ? start : s - 1)), 1000);
    return () => clearInterval(id);
  }, [start]);
  return left;
}

/** Static explanation (no numbers) until the pool and relayers are live. */
function PoolActivityStatic() {
  const items = [
    { k: "batches", v: "Shards leave the pool together on a fixed rhythm, never one at a time." },
    { k: "full stack", v: "Each transfer's trace shows whether all five layers ran." },
    { k: "relayers", v: "Independent relayers in different regions pay gas and fire delayed exits." },
  ];
  return (
    <Section tone="odd" labelledBy="pool-title">
      <SectionHeading
        id="pool-title"
        eyebrow="a day inside the pool"
        title="Deposits mixing, relayers online."
        sub="Live pool activity, relayer status and batch timing appear here when the Reuno pool launches."
      />
      <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((i) => (
          <li key={i.k} className="card p-5 md:p-6">
            <CardHeader left={i.k} right={<StatusDot tone="brand" pulse={false} />} />
            <p className="mt-3 text-sm text-ink-2">{i.v}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function PoolActivity() {
  return FLAGS.poolActivity ? <PoolActivityLive /> : <PoolActivityStatic />;
}

/** Rendered only when FLAGS.poolActivity is on — wire to the pool + relayer APIs first. */
function PoolActivityLive() {
  const left = useCountdown(POOL_STATS.nextBatchSeconds);

  return (
    <Section tone="odd" labelledBy="pool-title">
      <SectionHeading id="pool-title" eyebrow="a day inside the pool" title="Deposits mixing, relayers online." />
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader
            left="pool activity by hour · demo"
            right={
              <Pill dot="warn">
                next batch <span className="mono-num text-ink-1">{formatClock(left)}</span>
              </Pill>
            }
          />
          <p className="sr-only">
            Heatmap of pool deposits by weekday and hour, demo data. Activity peaks mid-day and on
            weekends.
          </p>
          <div aria-hidden="true" className="mt-6 grid grid-cols-[32px_1fr] gap-x-2 gap-y-1">
            {DAYS.map((d, di) => (
              <div key={d} className="contents">
                <span className="text-mono-label flex items-center text-ink-3">{d}</span>
                <div className="grid gap-[2px] sm:gap-[3px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                  {HEATMAP[di].map((v, h) => (
                    <span key={h} className={cn("aspect-square rounded-[2px] sm:rounded-[3px]", STEPS[v])} />
                  ))}
                </div>
              </div>
            ))}
            <span />
            <div className="relative mt-2 h-4">
              {["00", "06", "12", "18"].map((h, i) => (
                <span
                  key={h}
                  className="mono-num absolute text-xs text-ink-3"
                  style={{ left: `${(i * 6 * 100) / 24}%` }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
          <div aria-hidden="true" className="mt-5 flex items-center justify-end gap-1.5">
            <span className="text-mono-label mr-1 text-ink-3">less</span>
            {STEPS.map((s) => (
              <span key={s} className={cn("h-3 w-3 rounded-[3px]", s)} />
            ))}
            <span className="text-mono-label ml-1 text-ink-3">more</span>
          </div>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <Card>
            <CardHeader left="full stack" />
            <p className="mono-num mt-3 text-[40px] leading-none text-ink-1">{POOL_STATS.fullStack}</p>
            <p className="mt-2 text-sm text-ink-2">{POOL_STATS.fullStackCaption}</p>
          </Card>
          <Card>
            <CardHeader left="relayers online · demo" />
            <p className="mono-num mt-3 text-[40px] leading-none text-ink-1">{POOL_STATS.relayersOnline}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {POOL_STATS.regions.map((r) => (
                <li key={r}>
                  <Pill dot="ok">{r}</Pill>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader left="next exit · demo" right={<StatusDot tone="warn" />} />
            <p className="mono-num mt-3 text-[28px] leading-none text-ink-1">{POOL_STATS.nextExit}</p>
          </Card>
        </div>
      </div>
    </Section>
  );
}
