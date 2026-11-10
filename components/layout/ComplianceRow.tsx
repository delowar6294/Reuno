import { cn } from "@/lib/cn";
import { Pill } from "@/components/ui/Pill";

export const COMPLIANCE_PILLS = ["viewing keys", "deposit screening", "proof of reserves"];

export function ComplianceRow({
  withLine = true,
  className,
  center = false,
}: {
  withLine?: boolean;
  className?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-3", center && "items-center text-center", className)}>
      {withLine && <p className="text-sm font-medium text-ink-1">Private by default. Accountable by choice.</p>}
      <ul className={cn("flex flex-wrap gap-2", center && "justify-center")} aria-label="Accountability features">
        {COMPLIANCE_PILLS.map((p) => (
          <li key={p}>
            <Pill>{p}</Pill>
          </li>
        ))}
      </ul>
    </div>
  );
}
