import { cn } from "@/lib/cn";

export function MonoLabel({
  children,
  className,
  bracket = true,
}: {
  children: string;
  className?: string;
  bracket?: boolean;
}) {
  const text = children.toLowerCase();
  return (
    <span className={cn("text-mono-label text-brand-300", className)}>
      {bracket ? `[ ${text} ]` : text}
    </span>
  );
}
