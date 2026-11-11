"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lockup } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { useModal } from "@/components/modals/ModalProvider";
import { XLink } from "@/components/ui/XLink";
import { NAV_LINKS } from "@/data/nav";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { openModal } = useModal();

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const nodes = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink-1 hover:bg-surface-2 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={sheetRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[90] flex flex-col bg-bg-0 lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <Lockup />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink-1 hover:bg-surface-2"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 pt-6 sm:px-6">
              <ul className="flex flex-col">
                {NAV_LINKS.map((l) => (
                  <li key={l.href} className="border-b border-line-1">
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block py-4 font-display text-[20px] text-ink-1 transition-colors duration-[180ms] hover:text-brand-200"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-3 p-4 pb-8 sm:px-6">
              <XLink label className="self-start -ml-3" />
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setOpen(false);
                  openModal("tor");
                }}
              >
                Open in Tor
              </Button>
              <Button href="/app" size="lg">
                Open app
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
