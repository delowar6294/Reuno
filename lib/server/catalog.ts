import "server-only";
import { z } from "zod";
import type { CatalogModel } from "./catalog-types";
import { cached, fetchJson, lastGood } from "./http";

export type { CatalogModel };

/* ---------------- OpenRouter model catalog ---------------- */
// Verified 2026-11-10: GET https://openrouter.ai/api/v1/models returns
// { data: [{ id, name, pricing: { prompt, completion } (USD per token, as strings) }] }

const OrModels = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      pricing: z.object({ prompt: z.string(), completion: z.string() }).passthrough(),
    }),
  ),
});


export async function getModelCatalog(): Promise<CatalogModel[] | null> {
  try {
    return await cached("openrouter-models", 60 * 60_000, async () => {
      const res = await fetchJson("https://openrouter.ai/api/v1/models", OrModels, {
        label: "openrouter",
        timeoutMs: 8000,
        revalidate: 3600,
      });
      return res.data
        .filter((m) => !m.id.endsWith(":batch") && !m.id.includes(":free"))
        .map((m) => {
          const [provider] = m.id.split("/");
          const name = m.name.includes(": ") ? m.name.split(": ").slice(1).join(": ") : m.name;
          return {
            id: m.id,
            name,
            provider,
            input: Number(m.pricing.prompt) * 1_000_000,
            output: Number(m.pricing.completion) * 1_000_000,
          };
        })
        .filter((m) => Number.isFinite(m.input) && Number.isFinite(m.output) && m.input >= 0 && m.output >= 0);
    });
  } catch (err) {
    console.warn(`[catalog] ${(err as Error).message}`);
    return lastGood<CatalogModel[]>("openrouter-models") ?? null;
  }
}

/* ---------------- Robinhood Stock Token registry ---------------- */
// Verified 2026-11-10: GET https://api.robinhood.com/rhj/assets returns { assets: [{ tokenSymbol, status, deployments }] }

const RhAssets = z.object({
  assets: z.array(
    z.object({
      tokenSymbol: z.string(),
      status: z.string(),
      deployments: z.array(z.object({ chainId: z.number(), contractAddress: z.string() })),
    }),
  ),
});

/** Number of active Robinhood Stock Tokens deployed on chain 4663. */
export async function getStockTokenCount(): Promise<number | null> {
  try {
    return await cached("rh-assets-count", 60 * 60_000, async () => {
      const res = await fetchJson("https://api.robinhood.com/rhj/assets", RhAssets, {
        label: "robinhood assets",
        timeoutMs: 8000,
        revalidate: 3600,
      });
      return res.assets.filter(
        (a) => a.status === "ASSET_STATUS_ACTIVE" && a.deployments.some((d) => d.chainId === 4663),
      ).length;
    });
  } catch (err) {
    console.warn(`[catalog] ${(err as Error).message}`);
    return lastGood<number>("rh-assets-count") ?? null;
  }
}
