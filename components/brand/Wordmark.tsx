import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

export function Wordmark({ size = "nav", className }: { size?: "nav" | "footer"; className?: string }) {
  return (
    <span
      className={cn(
        "text-grad-silver font-display font-semibold leading-none tracking-[-0.02em]",
        size === "nav" ? "text-[20px]" : "text-[28px]",
        className,
      )}
    >
      reuno
    </span>
  );
}

/** Icon + wordmark lockup. Always links home. */
export function Lockup({ size = "nav", className }: { size?: "nav" | "footer"; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Reuno home"
      className={cn("inline-flex items-center gap-[10px] rounded-sm", className)}
    >
      <Logo size={size === "nav" ? 32 : 40} decorative priority={size === "nav"} />
      <Wordmark size={size} />
    </Link>
  );
}
