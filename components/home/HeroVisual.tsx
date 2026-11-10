"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { LiveTransferCard } from "./LiveTransferCard";

export function HeroVisual() {
  const reduce = useReducedMotion();
  const loop = { duration: 6, ease: "easeInOut" as const, repeat: Infinity };

  return (
    <div className="relative mx-auto flex w-full max-w-[460px] flex-col items-center lg:items-end">
      <div className="relative h-[240px] w-[240px] md:h-[360px] md:w-[360px]">
        {/* glow disk */}
        <motion.div
          aria-hidden="true"
          className="absolute -inset-16 rounded-full bg-grad-glow"
          animate={reduce ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={loop}
        />
        {/* cyan halo, slightly left of centre (matches cyan piece of the R) */}
        <motion.div
          aria-hidden="true"
          className="absolute left-[18%] top-[38%] h-1/3 w-1/3 rounded-full shadow-glow-soft"
          animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
          transition={loop}
        />
        <motion.div
          className="relative h-full w-full"
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={loop}
        >
          <Logo fluid priority sizes="(min-width: 768px) 360px, 240px" />
        </motion.div>
      </div>

      <div className="relative z-10 -mt-16 w-full max-w-[300px] self-center md:-mt-24 lg:self-start">
        <LiveTransferCard />
      </div>
    </div>
  );
}
