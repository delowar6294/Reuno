"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

export type AccordionItem = { q: string; a: string };

export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  const reduce = useReducedMotion();

  return (
    <div className={cn("card divide-y divide-line-1 p-0", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${base}-btn-${i}`;
        const panelId = `${base}-panel-${i}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-display text-[17px] font-medium text-ink-1 transition-colors duration-[180ms] hover:text-brand-200 md:px-6"
              >
                {item.q}
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}
                  className="shrink-0 text-ink-3"
                >
                  <ChevronDown className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[62ch] px-5 pb-5 text-ink-2 md:px-6">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
