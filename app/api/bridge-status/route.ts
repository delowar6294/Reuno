import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { BRIDGE_SOURCE_IDS } from "@/config/bridge-ids";
import { getBridgeStatus } from "@/lib/server/lifi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Params = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "invalid tx hash"),
  fromChain: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((id) => BRIDGE_SOURCE_IDS.includes(id), "unsupported source chain"),
  bridge: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
});

export async function GET(req: NextRequest) {
  const parsed = Params.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  try {
    const status = await getBridgeStatus(parsed.data);
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const msg = (err as Error).message;
    // LI.FI answers 404 until it has indexed the source transaction.
    if (/HTTP 404/.test(msg)) {
      return NextResponse.json(
        { status: "NOT_FOUND", substatus: null, substatusMessage: null, receivingTxHash: null, receivingTxLink: null, toAmount: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error(`[api/bridge-status] ${msg}`);
    return NextResponse.json({ error: "Could not read bridge status right now" }, { status: 502 });
  }
}
