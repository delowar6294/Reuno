"use client";

import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CopyField } from "@/components/ui/CopyField";

const STEPS = [
  "Download Tor Browser from torproject.org.",
  "Open the Reuno .onion address in Tor Browser.",
  "Verify the address matches the one published here, character by character.",
];

export function TorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Open in Tor">
      <p className="text-ink-2">
        Reuno runs as a .onion hidden service, so your IP never reaches our servers or anyone
        else&apos;s.
      </p>
      <ol className="mt-6 flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <li key={s} className="flex gap-3 text-sm text-ink-2">
            <span className="mono-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-2 text-xs text-brand-300">
              {i + 1}
            </span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
      {/* TODO: replace with the real .onion address at launch */}
      <CopyField className="mt-6" value="reuno…onion" label="onion address" note="address published at launch" />
      <a
        href="https://www.torproject.org/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-brand-300 underline-offset-4 transition-colors duration-[180ms] hover:text-brand-200 hover:underline"
      >
        Get Tor Browser at torproject.org
        <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </a>
    </Modal>
  );
}
