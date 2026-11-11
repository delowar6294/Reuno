import { X_HANDLE, X_PROFILE_URL } from "@/config/social";
import { cn } from "@/lib/cn";

/** X (formerly Twitter) logo mark. Lucide no longer ships brand icons, so it is drawn inline. */
export function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

/** Square icon button that opens Reuno's X profile in a new tab. */
export function XLink({ className, label = false }: { className?: string; label?: boolean }) {
  return (
    <a
      href={X_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Reuno on X (${X_HANDLE}), opens in a new tab`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm text-ink-2 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-ink-1",
        label ? "h-9 px-3 text-sm" : "h-9 w-9",
        className,
      )}
    >
      <XLogo className="h-4 w-4" />
      {label && <span>{X_HANDLE}</span>}
    </a>
  );
}
