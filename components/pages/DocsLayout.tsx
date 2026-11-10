"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type DocSection = { id: string; title: string };

export function DocsNav({ sections }: { sections: DocSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  return (
    <>
      {/* mobile dropdown */}
      <div className="lg:hidden">
        <label htmlFor="docs-jump" className="text-mono-label mb-2 block text-ink-3">
          on this page
        </label>
        <select
          id="docs-jump"
          value={active}
          onChange={(e) => {
            setActive(e.target.value);
            document.getElementById(e.target.value)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="h-11 w-full appearance-none rounded-sm border border-line-1 bg-surface-3 px-3 text-sm text-ink-1 focus:border-line-3 focus:outline-none"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id} className="bg-surface-1">
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* desktop sidebar */}
      <nav aria-label="Docs" className="sticky top-24 hidden lg:block">
        <p className="text-mono-label mb-4 text-ink-3">docs</p>
        <ul className="flex flex-col border-l border-line-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l py-2 pl-4 text-sm transition-colors duration-[180ms]",
                  active === s.id
                    ? "border-brand-400 text-brand-300"
                    : "border-transparent text-ink-2 hover:text-ink-1",
                )}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
