import { NextResponse, type NextRequest } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { BRIDGE_SOURCE_IDS } from "@/config/bridge-ids";
import { getBridgeQuote, RouteUnavailableError } from "@/lib/server/lifi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Params = z.object({
  fromChain: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((id) => BRIDGE_SOURCE_IDS.includes(id), "unsupported source chain"),
  usd: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "amount must have at most 2 decimals")
    .transform(Number)
    .refine((n) => n >= 1 && n <= 10_000, "amount must be between $1 and $10,000"),
  from: z.string().refine((a) => isAddress(a), "invalid address"),
});

export async function GET(req: NextRequest) {
  const parsed = Params.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { fromChain, usd, from } = parsed.data;
  try {
    const quote = await getBridgeQuote({ fromChain, usd, fromAddress: from as `0x${string}` });
    return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof RouteUnavailableError) {
      return NextResponse.json({ error: "No bridge route for this chain and amount yet", code: "NO_ROUTE" }, { status: 404 });
    }
    console.error(`[api/bridge-quote] ${(err as Error).message}`);
    return NextResponse.json({ error: "Could not get a bridge quote right now" }, { status: 502 });
  }
}
