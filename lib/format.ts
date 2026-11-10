export function middleTruncate(value: string, max = 28): string {
  if (value.length <= max) return value;
  const keep = Math.floor((max - 1) / 2);
  return `${value.slice(0, keep)}…${value.slice(value.length - keep)}`;
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function isEvmAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

/** $1,234.56 at or above $1, $0.1234 below $1. */
export function formatUsd(value: number): string {
  const digits = Math.abs(value) >= 1 ? 2 : 4;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** $1.84M, $572K, $950. */
export function formatCompactUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(value >= 1e5 ? 0 : 1)}K`;
  return `$${value.toFixed(0)}`;
}

/** Per-1M-token model price. */
export function formatPerMillion(value: number): string {
  if (value === 0) return "free";
  if (value >= 1) return `$${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}`;
  return `$${value.toFixed(value >= 0.1 ? 2 : 4)}`;
}

export function shortAddress(address: string, head = 6, tail = 4): string {
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function formatPct(value: number): string {
  return `${Math.abs(value).toFixed(2)}%`;
}

export function changeWords(value: number): string {
  if (value > 0) return `up ${value.toFixed(2)} percent`;
  if (value < 0) return `down ${Math.abs(value).toFixed(2)} percent`;
  return "unchanged";
}

/** ETH amount from wei, rounded UP to `sig` significant digits (so "about X" never understates a requirement). */
export function formatEthCeil(wei: bigint, sig = 3): string {
  if (wei <= BigInt(0)) return "0";
  const n = Number(wei) / 1e18;
  const mag = Math.floor(Math.log10(n));
  const factor = Math.pow(10, sig - 1 - mag);
  const up = Math.ceil(n * factor - 1e-9) / factor;
  return up.toLocaleString("en-US", { maximumFractionDigits: Math.max(0, sig - 1 - mag), useGrouping: false });
}

/** ETH amount from wei for display (4 significant digits below 1, 4 decimals above). */
export function formatEth(wei: bigint): string {
  const n = Number(wei) / 1e18;
  if (n === 0) return "0";
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { maximumSignificantDigits: 4 });
}
