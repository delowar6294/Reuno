import { NextResponse, type NextRequest } from "next/server";
import { isAddress, isHex } from "viem";
import { z } from "zod";
import { CHAIN } from "@/config/chain";
import { UNISWAP_V4 } from "@/config/uniswap";
import type { V4Plan } from "@/lib/market-types";
import { encodeV4Swap } from "@/lib/server/uniswapV4";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-encodes a v4 swap plan from /api/trade-quote together with the user's Permit2 signature.
// The output is unsigned calldata for the user's own wallet to review and sign; nothing is sent from here.

const addr = z.string().refine((a) => isAddress(a), "invalid address") as unknown as z.ZodType<`0x${string}`>;
const uint = z.string().regex(/^\d{1,78}$/);
const PoolKey = z.object({ currency0: addr, currency1: addr, fee: z.number().int().min(0).max(0xffffff), tickSpacing: z.number().int(), hooks: addr });
const PathKey = z.object({
  intermediateCurrency: addr,
  fee: z.number().int().min(0).max(0xffffff),
  tickSpacing: z.number().int(),
  hooks: addr,
  hookData: z.string().refine((h) => isHex(h)) as unknown as z.ZodType<`0x${string}`>,
});
const Amounts = { amountIn: uint, amountOutMin: uint, deadline: z.number().int().positive() };
const Plan = z.union([
  z.object({ kind: z.literal("single"), poolKey: PoolKey, zeroForOne: z.boolean(), ...Amounts }),
  z.object({ kind: z.literal("path"), currencyIn: addr, path: z.array(PathKey).min(1).max(3), ...Amounts }),
]);
const Body = z.object({
  plan: Plan,
  permit: z.object({
    details: z.object({ token: addr, amount: uint, expiration: uint, nonce: uint }),
    spender: addr,
    sigDeadline: uint,
  }),
  signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/, "invalid signature") as unknown as z.ZodType<`0x${string}`>,
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { plan, permit, signature } = parsed.data;
  if (permit.spender.toLowerCase() !== UNISWAP_V4.universalRouter.toLowerCase()) {
    return NextResponse.json({ error: "Permit spender mismatch" }, { status: 400 });
  }
  if (BigInt(permit.details.amount) < BigInt(plan.amountIn)) {
    return NextResponse.json({ error: "Permit amount is below the swap amount" }, { status: 400 });
  }
  if (plan.deadline < Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ error: "This quote expired. Get a fresh quote." }, { status: 410 });
  }
  const tx = encodeV4Swap(plan as V4Plan, { permit, signature });
  return NextResponse.json({ ...tx, gasLimit: null, chainId: CHAIN.id }, { headers: { "Cache-Control": "no-store" } });
}
