"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Fixed, full-viewport particle cloud behind the whole home page.
 * Sits under the page content (negative z-index); home sections are translucent so it shows through.
 */
export function ParticleBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    // <body> paints its own background above negative-z layers; <html> already carries the same --bg-0,
    // so let the body be transparent while the backdrop is mounted.
    const prevBg = document.body.style.background;
    document.body.style.background = "transparent";
    let disposed = false;
    let hero: { dispose(): void } | null = null;
    import("@/lib/hero/particleEngine").then(({ startParticleHero }) => {
      if (disposed) return;
      hero = startParticleHero(canvas, host, { reduceMotion: !!reduce });
    });
    return () => {
      disposed = true;
      hero?.dispose();
      document.body.style.background = prevBg;
    };
  }, [reduce]);

  return (
    <div ref={hostRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
