"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Lockup } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { ModalButton } from "@/components/modals/ModalButton";
import { XLink } from "@/components/ui/XLink";
import { NAV_LINKS } from "@/data/nav";
import { cn } from "@/lib/cn";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-16 border-b backdrop-blur-md transition-colors duration-[180ms]",
        "bg-scrim",
        scrolled ? "border-line-1" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Lockup />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {NAV_LINKS.map((l) => {
              const active = !l.href.startsWith("/#") && pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-sm text-sm transition-colors duration-[180ms]",
                      active ? "text-brand-300" : "text-ink-2 hover:text-ink-1",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <XLink className="hidden sm:inline-flex" />
          <ModalButton modal="tor" variant="secondary" size="sm" className="hidden lg:inline-flex">
            Open in Tor
          </ModalButton>
          <Button href="/app" size="sm">
            Open app
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
