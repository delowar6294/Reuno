// DEMO DATA — replace with live source

/**
 * Coarse land mask, equirectangular. 64 columns (lon -180..180) by 26 rows
 * (lat 78..-62). "x" = land dot. Hand-drawn, intentionally low-detail.
 */
const MASK = [
  "......................xxxxx.................xxxx................",
  "............xxxxxxx..xxxxxx............xxxxxxxxxxxxxxxxxxx......",
  "..xxxxxxxxxxxxxxxxxxx.xxxxx......xxxx.xxxxxxxxxxxxxxxxxxxxxxxx..",
  "...xxxxxxxxxxx...xxxx..x.......xxxxx.xxxxxxxxxxxxxxxxxxxxxxxx...",
  "........xxxxxxxxxxxxxxx.......xx.xxxxxxxxxxxxxxxxxxxxxxxxxxxx...",
  "........xxxxxxxxxxxxxx........xx.xxxxxxxxxxxxxxxxxxxxxxxxxx.....",
  ".........xxxxxxxxxxxx.........xxxxxxxxx.xxxxxxxxxxxxxxxxx.x.....",
  ".........xxxxxxxxxxx..........xxx.x..xxxx.xxxxxxxxxxxxxxx.xx....",
  "..........xxxxxxxxx...........xxxxxxxxxxxxxxxxxxxxxxxxxxx.......",
  "...........xxxxxx.x..........xxxxxxxxxx.xxxx.xxxxxxxxxxx........",
  "............xxxxx.x..........xxxxxxxxxx.xxx..xxxx.xxxxx.........",
  "..............xxx............xxxxxxxxxxx.....xx...xxx.x.........",
  "................xxxxxx.......xxxxxxxxxxxx........xx...x.........",
  "..................xxxxxx.......xxxxxxxxxx.........xx.xx.........",
  "..................xxxxxxxx.......xxxxxxxx........xx..xxx........",
  "..................xxxxxxxxxx......xxxxxxx.........xxxxxxx.xx....",
  "...................xxxxxxxxxx.....xxxxxxx.........xxx...........",
  "...................xxxxxxxxxx.....xxxxxxx.x............xxxx.....",
  "....................xxxxxxxx......xxxxxx..x..........xxxxxxx....",
  "....................xxxxxxx.......xxxxx..........xx.xxxxxxxx....",
  "....................xxxxxx........xxxx............xxxxxxxxx.....",
  "....................xxxxx..........xx...............xxxxx...x...",
  "....................xxxx....................................xx..",
  "....................xxx.........................................",
  "....................xx..........................................",
  "................................................................",
];

export const MAP_COLS = 64;
export const MAP_ROWS = MASK.length;
const LAT_TOP = 78;
const LAT_BOTTOM = -62;

export type Dot = { x: number; y: number };

/** Dot centres in a 0..MAP_COLS by 0..MAP_ROWS coordinate space. */
export const LAND_DOTS: Dot[] = MASK.flatMap((row, y) =>
  row
    .padEnd(MAP_COLS, ".")
    .slice(0, MAP_COLS)
    .split("")
    .flatMap((c, x) => (c === "x" ? [{ x: x + 0.5, y: y + 0.5 }] : [])),
);

export function project(lat: number, lon: number): Dot {
  const x = ((lon + 180) / 360) * MAP_COLS;
  const y = ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * MAP_ROWS;
  return { x, y };
}

export type Relayer = {
  code: string;
  city: string;
  lat: number;
  lon: number;
  labelSide: "left" | "right";
  labelDy: number;
};

export const RELAYERS: Relayer[] = [
  { code: "fra", city: "Frankfurt", lat: 50.1, lon: 8.7, labelSide: "right", labelDy: 1.1 },
  { code: "ams", city: "Amsterdam", lat: 52.4, lon: 4.9, labelSide: "left", labelDy: -0.9 },
  { code: "iad", city: "Ashburn", lat: 39.0, lon: -77.5, labelSide: "right", labelDy: 0 },
  { code: "sin", city: "Singapore", lat: 1.35, lon: 103.8, labelSide: "left", labelDy: 0 },
  { code: "syd", city: "Sydney", lat: -33.9, lon: 151.2, labelSide: "right", labelDy: 0 },
];
