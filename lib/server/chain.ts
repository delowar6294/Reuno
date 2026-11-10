import "server-only";
import { createPublicClient, erc20Abi, http } from "viem";
import { RH_RPC_URL, robinhoodChain } from "@/config/chain";
import { NATIVE_ETH } from "@/config/tokens";

export const rhPublicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(RH_RPC_URL, { timeout: 8000 }),
});

const decimals = new Map<string, number>();

/** ERC-20 decimals read from the contract on Robinhood Chain (never from a third-party list). */
export async function onchainDecimals(address: `0x${string}`): Promise<number> {
  if (address.toLowerCase() === NATIVE_ETH.toLowerCase()) return 18;
  const key = address.toLowerCase();
  const hit = decimals.get(key);
  if (hit !== undefined) return hit;
  const d = await rhPublicClient.readContract({ address, abi: erc20Abi, functionName: "decimals" });
  decimals.set(key, d);
  return d;
}
