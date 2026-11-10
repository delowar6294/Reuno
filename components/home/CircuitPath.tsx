"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Fragment } from "react";
import { Section, SectionHeading } from "@/components/layout/Section";
import { Logo } from "@/components/brand/Logo";

const NODES = [
  { code: "YOU", label: "you" },
  { code: "GD", label: "guard" },
  { code: "MD", label: "middle" },
  { code: "RP", label: "rendezvous" },
  { code: "R", label: "reuno", logo: true },
];

function Link({ vertical, delay }: { vertical: boolean; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className={
        vertical
          ? "relative mx-auto h-10 w-px bg-line-2"
          : "relative h-px flex-1 bg-line-2"
      }
    >
      {!reduce && (
        <motion.span
          className="absolute h-2 w-2 rounded-full bg-brand-300 shadow-glow-brand"
          style={vertical ? { left: -3.5 } : { top: -3.5 }}
          initial={vertical ? { top: "0%", opacity: 0 } : { left: "0%", opacity: 0 }}
          animate={
            vertical
              ? { top: ["0%", "100%"], opacity: [0, 1, 1, 0] }
              : { left: ["0%", "100%"], opacity: [0, 1, 1, 0] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "linear", delay }}
        />
      )}
    </div>
  );
}

function Node({ node }: { node: (typeof NODES)[number] }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line-2 bg-surface-1">
        {node.logo ? (
          <Logo size={40} decorative />
        ) : (
          <span className="mono-num text-sm text-brand-200">{node.code}</span>
        )}
      </span>
      <span className="text-mono-label text-ink-3">{node.label}</span>
    </div>
  );
}

export function CircuitPath() {
  return (
    <Section tone="odd" labelledBy="circuit-title">
      <SectionHeading
        id="circuit-title"
        eyebrow="three hops, then the chain"
        title="No relay sees the whole path."
        align="center"
        className="mx-auto"
      />
      <p className="sr-only">
        Path: you, then a guard relay, a middle relay, a rendezvous point, then Reuno.
      </p>
      {/* desktop */}
      <div aria-hidden="true" className="mx-auto mt-16 hidden max-w-[880px] items-start md:flex">
        {NODES.map((n, i) => (
          <Fragment key={n.code}>
            <Node node={n} />
            {i < NODES.length - 1 && (
              <div className="flex flex-1 pt-8">
                <Link vertical={false} delay={i * 0.6} />
              </div>
            )}
          </Fragment>
        ))}
      </div>
      {/* mobile */}
      <div aria-hidden="true" className="mt-12 flex flex-col items-center md:hidden">
        {NODES.map((n, i) => (
          <Fragment key={n.code}>
            <Node node={n} />
            {i < NODES.length - 1 && (
              <div className="py-2">
                <Link vertical delay={i * 0.6} />
              </div>
            )}
          </Fragment>
        ))}
      </div>
      <p className="text-mono-label mt-10 text-center text-ink-3">each hop sees one step, never the whole path</p>
    </Section>
  );
}
