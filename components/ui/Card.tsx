import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  hover = false,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "li" | "section";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        "card p-5 md:p-6",
        hover &&
          "transition-[transform,border-color] duration-[180ms] ease-reuno hover:-translate-y-0.5 hover:border-line-2",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  left,
  right,
  className,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-mono-label text-ink-3">{left}</span>
      {right && <span className="flex items-center gap-2">{right}</span>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line-1", className)} aria-hidden="true" />;
}
