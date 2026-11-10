"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CardHeader } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";
import { LIVE_TRANSFER } from "@/data/transfers";

export function LiveTransferCard() {
  const reduce = useReducedMotion();
  return (
    <div className="card p-5">
      <CardHeader
        className="whitespace-nowrap [&_span]:tracking-[0.02em]"
        left={LIVE_TRANSFER.header}
        right={<span className="text-mono-label text-brand-300">{LIVE_TRANSFER.meta}</span>}
      />
      <p className="mono-num mt-4 text-[32px] leading-none text-silver-100">{LIVE_TRANSFER.amount}</p>
      <div
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-label="Transfer progress, demo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={reduce ? 100 : undefined}
      >
        <motion.div
          className="h-full rounded-full bg-grad-brand"
          initial={{ width: reduce ? "100%" : "0%" }}
          animate={{ width: "100%" }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 4, ease: "linear", repeat: Infinity, repeatDelay: 1.5 }
          }
        />
      </div>
      <ul className="mt-4 flex flex-col gap-2.5">
        {LIVE_TRANSFER.steps.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2.5 text-ink-2">
              <StatusDot tone={s.tone} />
              {s.label}
            </span>
            {s.right && <span className="mono-num text-xs text-ink-3">{s.right}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
