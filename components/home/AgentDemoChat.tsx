"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CardHeader } from "@/components/ui/Card";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { Logo } from "@/components/brand/Logo";
import { Tooltip } from "@/components/ui/Tooltip";
import { EASE } from "@/lib/motion";

const TOTAL_STEPS = 6;

function ToolRow({ name, result, children }: { name: string; result: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-line-1 bg-surface-1 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-mono text-xs text-brand-300">{name}</span>
        <span className={result === "unsigned" ? "mono-num text-xs text-warn" : "mono-num text-xs text-ok"}>{result}</span>
      </div>
      {children}
    </div>
  );
}

export function AgentDemoChat() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce) {
      setStep(TOTAL_STEPS);
      return;
    }
    if (!inView) return;
    setStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      timers.push(setTimeout(() => setStep(i), i * 900));
    }
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, run]);

  const item = (i: number, node: React.ReactNode) =>
    step >= i && (
      <motion.div
        key={`${run}-${i}`}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        {node}
      </motion.div>
    );

  return (
    <div ref={ref}>
      <div className="card p-5 md:p-6">
        <CardHeader
          left="agent session · example"
          right={
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-xs text-ink-3 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-ink-1"
              aria-label="Replay example"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              replay
            </button>
          }
        />
        <div className="mt-5 flex min-h-[520px] flex-col gap-3" aria-live="polite">
          <AnimatePresence initial={false}>
            {item(
              1,
              <div className="ml-auto max-w-[85%] rounded-md rounded-tr-sm bg-surface-3 px-4 py-3 text-sm text-ink-1">
                Check my portfolio and TSLA&apos;s price, then buy $50 of TSLA privately.
              </div>,
            )}
            {item(
              2,
              <ToolRow name="reuno_portfolio" result="200 OK">
                <div className="flex items-center gap-2">
                  {["NVDA", "TSLA", "AAPL"].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-2">
                      <LetterAvatar text={t} size={20} />
                      {t}
                    </span>
                  ))}
                </div>
              </ToolRow>,
            )}
            {item(3, <ToolRow name="reuno_quote · TSLA" result="200 OK" />)}
            {item(4, <ToolRow name="reuno_build_trade · TSLA · $50 · private" result="unsigned" />)}
            {item(
              5,
              <div className="panel-highlight rounded-lg border border-line-2 bg-surface-2 p-4">
                <span className="text-mono-label text-warn">needs your approval</span>
                <p className="mono-num mt-2 text-[32px] leading-none text-silver-100">$50.00</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
                  {[
                    ["side", "buy"],
                    ["token", "0x322F…3b2d"],
                    ["chain_id", "4663"],
                    ["signed by", "your wallet"],
                  ].map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-ink-3">{k}</dt>
                      <dd className="text-right text-ink-1">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Tooltip content="example only" className="mt-4">
                  <Button size="sm" disabled>
                    Approve
                  </Button>
                </Tooltip>
              </div>,
            )}
            {item(
              6,
              <div className="flex max-w-[90%] gap-2.5">
                <Logo size={28} decorative />
                <div className="rounded-md rounded-tl-sm border border-line-1 bg-surface-1 px-4 py-3 text-sm text-ink-2">
                  Signed by the agent wallet and sent through all five layers.
                </div>
              </div>,
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-3">
        Example conversation — trades are built by Reuno and signed by your agent&apos;s own wallet.
      </p>
    </div>
  );
}
