import { NextResponse, type NextRequest } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { tokenByTicker } from "@/config/tokens";
import { getTradeQuote, RouteUnavailableError } from "@/lib/server/lifi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Params = z.object({
  side: z.enum(["buy", "sell"]),
  ticker: z.string().min(1).max(10),
  usd: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "amount must have at most 2 decimals")
    .transform(Number)
    .refine((n) => n > 0 && n <= 100_000, "amount out of range"),
  from: z.string().refine((a) => isAddress(a), "invalid address"),
});

export async function GET(req: NextRequest) {
  const parsed = Params.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { side, ticker, usd, from } = parsed.data;
  const token = tokenByTicker(ticker);
  if (!token) return NextResponse.json({ error: "Unknown token" }, { status: 400 });

  try {
    const quote = await getTradeQuote({ side, token, usd, fromAddress: from as `0x${string}` });
    return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof RouteUnavailableError) {
      return NextResponse.json({ error: "Route not available yet", code: "NO_ROUTE" }, { status: 404 });
    }
    console.error(`[api/trade-quote] ${(err as Error).message}`);
    return NextResponse.json({ error: "Could not get a quote right now" }, { status: 502 });
  }
}
