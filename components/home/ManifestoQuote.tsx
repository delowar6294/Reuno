"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/layout/Section";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Reveal, RevealItem } from "@/components/ui/Reveal";

const TIMES = ["09:00", "11:00", "15:00", "17:00"];

export function ManifestoQuote() {
  const reduce = useReducedMotion();
  return (
    <Section tone="odd" texture labelledBy="manifesto-title">
      <Reveal className="flex flex-col items-center text-center">
        <RevealItem>
          <MonoLabel>what we actually do</MonoLabel>
        </RevealItem>
        <RevealItem>
          <h2 id="manifesto-title" className="text-display-l mt-6 max-w-[18ch] text-ink-1">
            The best transaction is the one <span className="text-grad-brand">nobody can follow.</span>
          </h2>
        </RevealItem>
        <RevealItem className="mt-14 w-full max-w-[560px]">
          <div aria-hidden="true" className="relative">
            <div className="h-px w-full bg-line-2" />
            {!reduce && (
              <motion.span
                className="absolute -top-[5px] h-[11px] w-[11px] rounded-full bg-brand-300 shadow-glow-brand"
                animate={{ left: ["0%", "33.3%", "33.3%", "66.6%", "66.6%", "100%", "100%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ marginLeft: -5 }}
              />
            )}
            <div className="mt-4 flex justify-between">
              {TIMES.map((t) => (
                <span key={t} className="mono-num text-xs text-ink-3">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="text-mono-label mt-4 text-ink-3">one tick, one shard</p>
        </RevealItem>
      </Reveal>
    </Section>
  );
}
