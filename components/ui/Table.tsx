import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right";
};

/**
 * Desktop: a real table. Mobile (< md): stacked cards with label/value rows,
 * so nothing ever scrolls horizontally.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="card hidden overflow-hidden p-0 md:block">
        <table className="w-full border-collapse text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-line-1">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "text-mono-label h-12 px-6 font-medium text-ink-3",
                    c.align === "right" && "text-right",
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="h-14 border-b border-line-1 transition-colors duration-[180ms] last:border-b-0 hover:bg-surface-2"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-6 text-sm text-ink-2", c.align === "right" && "text-right", c.className)}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="card p-5">
            <dl className="flex flex-col gap-3">
              {columns.map((c) => (
                <div key={c.key} className="flex min-w-0 items-center justify-between gap-4">
                  <dt className="text-mono-label shrink-0 text-ink-3">{c.header}</dt>
                  <dd className="min-w-0 text-right text-sm text-ink-2">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
