import Image from "next/image";
import { cn } from "@/lib/cn";

export const LOGO_ALT = "Reuno logo: a geometric R in a cyan and silver diamond";
const SRC = "/brand/reuno-logo.png";

/**
 * Master logo, used as-is.
 * - size <= 64: app-icon treatment (rounded 22%, overflow hidden).
 * - size  > 64: radial mask so the PNG's navy edges fade into bg-0.
 * Pass `fluid` to fill the parent (parent must set the size, aspect 1:1).
 */
export function Logo({
  size = 32,
  priority = false,
  fluid = false,
  decorative = false,
  className,
  sizes,
}: {
  size?: number;
  priority?: boolean;
  fluid?: boolean;
  decorative?: boolean;
  className?: string;
  sizes?: string;
}) {
  const masked = fluid || size > 64;
  return (
    <span
      className={cn(
        "relative block aspect-square shrink-0",
        masked ? "logo-mask bg-bg-0" : "overflow-hidden rounded-[22%]",
        className,
      )}
      style={fluid ? undefined : { width: size, height: size }}
    >
      <Image
        src={SRC}
        alt={decorative ? "" : LOGO_ALT}
        width={1254}
        height={1254}
        priority={priority}
        sizes={sizes ?? `${size}px`}
        className="h-full w-full select-none object-cover"
        draggable={false}
      />
    </span>
  );
}
