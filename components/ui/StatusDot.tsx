import { cn } from "@/lib/cn";

export type StatusTone = "ok" | "warn" | "bad" | "brand";

const toneClass: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  brand: "bg-brand-400",
};

export function StatusDot({
  tone = "ok",
  pulse = true,
  className,
  label,
}: {
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn("relative inline-flex h-2 w-2 shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full motion-safe:animate-pulse-ring",
            toneClass[tone],
          )}
        />
      )}
      <span className={cn("relative h-2 w-2 rounded-full", toneClass[tone])} />
    </span>
  );
}
