"use client";

import { cloneElement, isValidElement, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type ChildProps = { "aria-describedby"?: string };

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: string;
  children: React.ReactElement<ChildProps>;
  side?: "top" | "bottom";
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 150);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  const child = isValidElement(children)
    ? cloneElement(children, { "aria-describedby": id })
    : children;

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(e) => e.key === "Escape" && hide()}
    >
      {child}
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-[220px] -translate-x-1/2 rounded-sm border border-line-2 bg-surface-3 px-2.5 py-1.5 text-xs text-ink-1 transition-opacity duration-[180ms]",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        {content}
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-line-2 bg-surface-3",
            side === "top" ? "-bottom-1 border-b border-r" : "-top-1 border-l border-t",
          )}
        />
      </span>
    </span>
  );
}
