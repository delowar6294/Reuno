"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useRef } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

export type TabItem = { id: string; label: string };

export function Tabs({
  items,
  value,
  onChange,
  idBase,
  className,
  label,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  idBase: string;
  className?: string;
  label: string;
}) {
  const layoutGroup = useId();
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex gap-1 border-b border-line-1", className)}
    >
      {items.map((item, i) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${idBase}-tab-${item.id}`}
            aria-selected={active}
            aria-controls={`${idBase}-panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "relative h-11 px-4 text-sm font-medium transition-colors duration-[180ms]",
              active ? "text-ink-1" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {item.label}
            {active && (
              <motion.span
                layoutId={`tab-indicator-${layoutGroup}`}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-400"
                transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  idBase,
  id,
  active,
  children,
  className,
}: {
  idBase: string;
  id: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${id}`}
      aria-labelledby={`${idBase}-tab-${id}`}
      hidden={!active}
      className={className}
    >
      {active && children}
    </div>
  );
}
