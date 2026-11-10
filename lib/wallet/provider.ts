"use client";

/** Minimal EIP-1193 provider shape. */
export type Eip1193Provider = {
  request(args: { method: string; params?: unknown }): Promise<unknown>;
};

/** The injected browser wallet, if any (MetaMask, Rabby, Coinbase Wallet extension, ...). */
export function injectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return eth && typeof eth.request === "function" ? eth : null;
}

/** Walks nested wallet/viem errors and returns the first numeric EIP-1193 / JSON-RPC code. */
export function errorCode(err: unknown): number | undefined {
  let cur: unknown = err;
  for (let i = 0; i < 6 && cur && typeof cur === "object"; i++) {
    const o = cur as { code?: unknown; data?: { originalError?: unknown }; cause?: unknown };
    if (typeof o.code === "number") return o.code;
    cur = o.data?.originalError ?? o.cause;
  }
  return undefined;
}

export function isUserRejection(err: unknown): boolean {
  if (errorCode(err) === 4001) return true;
  const e = err as { name?: string; message?: string };
  return e?.name === "UserRejectedRequestError" || /user (rejected|denied)|rejected the request/i.test(e?.message ?? "");
}
