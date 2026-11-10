"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Counts a number up from 0 once in view. Keeps the given number of decimals. */
export function Counter({
  to,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
  duration = 1.2,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, reduce, to, duration]);

  const shown = reduce ? to : val;

  return (
    <span ref={ref} className={cn("mono-num", className)}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}
