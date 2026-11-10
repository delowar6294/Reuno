"use client";

import useSWR from "swr";
import type { PricesResponse, QuotesResponse } from "./market-types";

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

const OPTIONS = {
  refreshInterval: 30_000,
  refreshWhenHidden: false,
  revalidateOnFocus: true,
  keepPreviousData: true,
  shouldRetryOnError: true,
  errorRetryInterval: 10_000,
} as const;

/** Featured live quotes for the /stocks hero. Refreshes every 30s while the tab is visible. */
export function useQuotes() {
  return useSWR<QuotesResponse>("/api/quotes", fetcher, OPTIONS);
}

/** Live prices for every configured stock token. */
export function usePrices() {
  return useSWR<PricesResponse>("/api/prices", fetcher, OPTIONS);
}
