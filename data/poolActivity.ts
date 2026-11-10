// DEMO DATA — replace with live source

export type DayBar = { day: string; deposits: number };

export const WEEKLY_DEPOSITS: DayBar[] = [
  { day: "mon", deposits: 142 },
  { day: "tue", deposits: 168 },
  { day: "wed", deposits: 155 },
  { day: "thu", deposits: 197 },
  { day: "fri", deposits: 224 },
  { day: "sat", deposits: 236 },
  { day: "sun", deposits: 268 },
];

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** Deterministic pseudo-random intensity 0–4 per (day, hour), so SSR and client match. */
function intensity(day: number, hour: number): number {
  const wave = Math.sin(((hour - 4) / 24) * Math.PI * 2) * 1.4 + 1.8;
  const noise = ((day * 31 + hour * 17 + day * hour * 7) % 11) / 11;
  const weekend = day >= 5 ? 0.4 : 0;
  return Math.max(0, Math.min(4, Math.round(wave + noise - 0.3 + weekend)));
}

export const HEATMAP: number[][] = DAYS.map((_, d) =>
  Array.from({ length: 24 }, (_, h) => intensity(d, h)),
);

export const POOL_STATS = {
  fullStack: "96%",
  fullStackCaption: "of transfers ran all five layers · demo",
  relayersOnline: "12",
  regions: ["fra", "iad", "sin", "syd", "ams"],
  nextExit: "in 14 min",
  nextBatchSeconds: 12 * 60,
};
