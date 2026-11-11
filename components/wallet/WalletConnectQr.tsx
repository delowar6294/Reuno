"use client";

import Image from "next/image";
import { Check, Copy, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { useMemo, useState } from "react";
import { QR_WALLET_IDS, walletById } from "@/config/wallets";
import { WalletLogo } from "./WalletLogo";

/** Builds one SVG path from the QR module matrix so the colors come from design tokens. */
function qrPath(uri: string): { d: string; size: number } {
  const qr = QRCode.create(uri, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qr.modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { d, size };
}

/** Our own WalletConnect QR: scan with any mobile wallet. Reuno's logo sits in the middle (error correction H). */
export function WalletConnectQr({ uri }: { uri: string | null }) {
  const [copied, setCopied] = useState(false);
  const qr = useMemo(() => (uri ? qrPath(uri) : null), [uri]);

  const copy = async () => {
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex aspect-square w-full max-w-[280px] items-center justify-center rounded-lg bg-silver-100 p-4">
        {qr ? (
          <>
            <svg viewBox={`0 0 ${qr.size} ${qr.size}`} className="h-full w-full" shapeRendering="crispEdges" role="img" aria-label="WalletConnect QR code">
              <path d={qr.d} className="fill-ink-inverse" />
            </svg>
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-silver-100">
              <Image
                src="/brand/reuno-logo.png"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
                style={{ maskImage: "radial-gradient(circle, black 66%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle, black 66%, transparent 70%)" }}
              />
            </span>
          </>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-ink-inverse" strokeWidth={1.75} aria-label="Preparing QR code" />
        )}
      </div>

      <p className="flex items-center gap-2 text-sm text-ink-2" role="status">
        <Loader2 className="h-4 w-4 animate-spin text-brand-300" strokeWidth={1.75} aria-hidden="true" />
        Waiting for approval in your wallet…
      </p>

      <button
        type="button"
        onClick={copy}
        disabled={!uri}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line-2 px-3.5 text-sm text-ink-1 transition-colors duration-[180ms] hover:bg-surface-2 disabled:opacity-50"
      >
        {copied ? <Check className="h-4 w-4 text-ok" strokeWidth={1.75} aria-hidden="true" /> : <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
        {copied ? "Copied" : "Copy link"}
      </button>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-ink-3">Scan with</span>
        <ul className="flex items-center gap-2">
          {QR_WALLET_IDS.map((id) => {
            const w = walletById(id)!;
            return (
              <li key={id} title={w.name}>
                <WalletLogo src={w.logo} name={w.name} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
