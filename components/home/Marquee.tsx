"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/** Infinite horizontal marquee, 40s loop, pauses on hover. Static wrap on reduced motion. */
export function Marquee({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("flex min-w-0 items-center gap-4", className)}>
      <span className="text-mono-label hidden shrink-0 text-ink-3 sm:inline">{label}</span>
      <span className="text-mono-label shrink-0 text-ink-3 sm:hidden">{label.split(" · ").at(-1)}</span>
      {reduce ? (
        <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-2">{children}</div>
      ) : (
        <div
          className="group relative min-w-0 flex-1 overflow-hidden"
          style={{
            maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="flex w-max animate-marquee gap-8 group-hover:[animation-play-state:paused]">
            <div className="flex shrink-0 gap-8">{children}</div>
            <div className="flex shrink-0 gap-8" aria-hidden="true">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
