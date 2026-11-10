import { Container } from "@/components/layout/Container";
import { StatusDot } from "@/components/ui/StatusDot";
import { TRANSFERS } from "@/data/transfers";
import { Marquee } from "./Marquee";

export function RecentTransfers() {
  return (
    <section aria-label="Recent transfers, demo data" className="border-y border-line-1 bg-bg-1 py-4">
      <Container>
        <Marquee label="last transfers · demo">
          {TRANSFERS.map((t) => (
            <span key={t.time} className="mono-num inline-flex items-center gap-2 whitespace-nowrap text-sm text-ink-2">
              <span className="text-ink-3">{t.time}</span>
              <span aria-hidden="true">·</span>
              {t.text}
              <span aria-hidden="true">·</span>
              {t.status === "unlinked" ? (
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot tone="ok" pulse={false} />
                  unlinked
                </span>
              ) : (
                <span className="text-brand-300">{t.status}</span>
              )}
            </span>
          ))}
        </Marquee>
      </Container>
    </section>
  );
}
