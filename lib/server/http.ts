import "server-only";
import type { ZodType } from "zod";

/** Fetch JSON with a hard timeout and zod validation. Throws on any failure. */
export async function fetchJson<T>(
  url: string,
  schema: ZodType<T>,
  {
    timeoutMs = 5000,
    label = url,
    revalidate,
  }: { timeoutMs?: number; label?: string; /** seconds; uses Next's data cache. Omit for no-store. */ revalidate?: number } = {},
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      ...(revalidate !== undefined ? { next: { revalidate } } : { cache: "no-store" as const }),
      headers: { accept: "application/json", "user-agent": "reuno-site/1.0" },
    });
    if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
    const json: unknown = await res.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`${label}: unexpected response shape — ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
    return parsed.data;
  } finally {
    clearTimeout(timer);
  }
}

type Entry<T> = { value: T; expires: number };
const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** Small in-memory TTL cache with request de-duplication. Errors are never cached. */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const p = load()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/** Last good value for a key, even if expired (used for stale-on-error). */
export function lastGood<T>(key: string): T | undefined {
  return (store.get(key) as Entry<T> | undefined)?.value;
}
