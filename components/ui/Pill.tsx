import { cn } from "@/lib/cn";
import { StatusDot, type StatusTone } from "./StatusDot";

export function Pill({
  children,
  dot,
  className,
}: {
  children: React.ReactNode;
  dot?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 whitespace-nowrap rounded-full border border-line-1 bg-surface-2 px-3 font-mono text-xs text-ink-2",
        className,
      )}
    >
      {dot && <StatusDot tone={dot} />}
      {children}
    </span>
  );
}
