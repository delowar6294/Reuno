"use client";

import { RollingDigits } from "@/components/ui/RollingDigits";
import { usePrices } from "@/lib/use-market";

/** Left-column stats on /stocks. Every value is real; the token count comes from live prices. */
export function LiveStats() {
  const { data, error } = usePrices();
  const live = data?.prices.length;

  const stats: { value: string | null; label: string }[] = [
    { value: live !== undefined ? String(live) : null, label: "live stock tokens" },
    { value: "5", label: "privacy layers" },
    { value: "0", label: "private keys we hold" },
  ];

  return (
    <dl className="grid max-w-[560px] grid-cols-3 gap-4 border-y border-line-1 py-5">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5">
          <dt className="text-mono-label order-2 text-ink-3">{s.label}</dt>
          <dd className="order-1 h-8 md:h-9">
            {s.value !== null ? (
              <RollingDigits
                value={s.value}
                glyphClassName="text-grad-silver"
                className="text-[28px] leading-none md:text-[32px]"
              />
            ) : error ? (
              <span className="mono-num text-[28px] leading-none text-ink-3 md:text-[32px]" title="Live prices unavailable">
                –
              </span>
            ) : (
              <span className="block h-7 w-12 rounded-sm bg-surface-3 motion-safe:animate-pulse" aria-label="Loading" />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
