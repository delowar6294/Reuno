import { cn } from "@/lib/cn";

/** Neutral stand-in for company/model/network logos: first letter(s) on surface-3. */
export function LetterAvatar({
  text,
  size = 28,
  className,
}: {
  text: string;
  size?: number;
  className?: string;
}) {
  const letters = text.length <= 2 ? text : text[0];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mono-num inline-flex shrink-0 items-center justify-center rounded-full border border-line-1 bg-surface-3 text-ink-1",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {letters}
    </span>
  );
}
