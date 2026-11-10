"use client";

import { motion, useReducedMotion } from "framer-motion";
import { containerVariants, itemVariants, VIEWPORT } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "li";
};

/** Stagger container: children using <RevealItem> fade + rise 16px when 20% visible. */
export function Reveal({ children, className, as = "div" }: Props) {
  const reduce = useReducedMotion();
  const Comp = as === "ul" ? motion.ul : as === "li" ? motion.li : motion.div;
  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Comp
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </Comp>
  );
}

export function RevealItem({ children, className, as = "div" }: Props) {
  const reduce = useReducedMotion();
  const Comp = as === "ul" ? motion.ul : as === "li" ? motion.li : motion.div;
  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Comp className={className} variants={itemVariants}>
      {children}
    </Comp>
  );
}
