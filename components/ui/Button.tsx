"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans font-medium transition-[background-color,border-color,color,box-shadow] duration-[180ms] ease-reuno";

const variants: Record<Variant, string> = {
  primary: "bg-grad-brand text-ink-inverse hover:shadow-glow-brand",
  secondary: "border border-line-2 bg-transparent text-ink-1 hover:bg-surface-2",
  ghost:
    "text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

const ghostSizes: Record<Size, string> = {
  sm: "h-9 text-sm",
  md: "h-11 text-[15px]",
  lg: "h-12 text-base",
};

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    href,
    external,
    loading,
    disabled,
    className,
    children,
    onClick,
    type = "button",
    ...rest
  },
  ref,
) {
  const inactive = disabled || loading;
  const classes = cn(
    base,
    variant === "ghost" ? ghostSizes[size] : sizes[size],
    variants[variant],
    inactive && "cursor-not-allowed opacity-45 hover:shadow-none hover:bg-transparent hover:no-underline",
    inactive && variant === "primary" && "hover:bg-grad-brand",
    className,
  );

  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </>
  );

  if (href && !inactive) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (inactive) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...rest}
    >
      {content}
    </button>
  );
});
