import Image from "next/image";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Official wallet logo, 32×32 inside a 40×40 surface-2 tile (or smaller via `size`).
 * `src` is either a file in /public/wallets or the data-URI icon a wallet announces via EIP-6963.
 * Logos keep their own brand colors: they are images, not CSS colors.
 */
export function WalletLogo({ src, name, size = "md", className }: { src?: string | null; name: string; size?: "md" | "sm"; className?: string }) {
  const box = size === "md" ? "h-10 w-10" : "h-6 w-6 rounded-sm";
  const img = size === "md" ? 32 : 18;
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2", box, className)}>
      {src ? (
        <Image src={src} alt="" width={img} height={img} unoptimized className="object-contain" style={{ width: img, height: img }} />
      ) : (
        <Wallet className="h-4 w-4 text-brand-300" strokeWidth={1.75} aria-hidden="true" />
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}
