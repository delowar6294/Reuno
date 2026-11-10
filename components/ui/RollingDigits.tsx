"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Odometer-style number. Digits roll from 0 to their target once the
 * element is 40% in view. Non-digit characters (%, +, comma, dot) are static.
 */
export function RollingDigits({
  value,
  className,
  glyphClassName,
  duration = 1.4,
}: {
  value: string;
  className?: string;
  /** Applied to every glyph (use for gradient text, which can't clip through transforms). */
  glyphClassName?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const chars = value.split("");

  return (
    <span ref={ref} className={cn("mono-num inline-flex", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((ch, i) => {
          if (!/\d/.test(ch)) {
            return (
              <span key={i} className={cn("inline-block", glyphClassName)}>
                {ch}
              </span>
            );
          }
          const target = Number(ch);
          if (reduce) {
            return (
              <span key={i} className={cn("inline-block", glyphClassName)}>
                {ch}
              </span>
            );
          }
          return (
            <span
              key={i}
              className="relative inline-block h-[1em] overflow-hidden leading-none"
              style={{ width: "1ch" }}
            >
              <motion.span
                className="absolute left-0 top-0 flex flex-col"
                initial={{ y: "0em" }}
                animate={{ y: inView ? `-${target}em` : "0em" }}
                transition={{ duration, ease: EASE, delay: i * 0.05 }}
              >
                {DIGITS.map((d) => (
                  <span key={d} className={cn("block h-[1em] leading-none", glyphClassName)}>
                    {d}
                  </span>
                ))}
              </motion.span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
