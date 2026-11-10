import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export function Banner({
  tone = "warn",
  children,
  className,
}: {
  tone?: "warn" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-surface-1 px-4 py-3 text-sm text-ink-2",
        tone === "warn" ? "border-line-2" : "border-line-1",
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "warn" ? "text-warn" : "text-brand-300")}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  );
}
