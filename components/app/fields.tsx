"use client";

import { cn } from "@/lib/cn";

export const inputClass =
  "h-12 w-full rounded-sm border border-line-1 bg-surface-3 px-3 text-ink-1 placeholder:text-ink-3 transition-colors duration-[180ms] hover:border-line-2 focus:border-line-3 focus:outline-none";

export function Field({
  label,
  htmlFor,
  children,
  error,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-mono-label text-ink-3">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-bad">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-ink-3">{hint}</p>
      )}
    </div>
  );
}

export function TokenSelect({
  id,
  value,
  onChange,
  options,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputClass, "mono-num appearance-none pr-8", className)}
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-surface-1">
          {o}
        </option>
      ))}
    </select>
  );
}

export function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-ink-3">{k}</span>
      <span className="mono-num text-right text-ink-1">{v}</span>
    </div>
  );
}
