// Generates favicons, app icons and the Open Graph image from the master logo.
// Run: npm run icons
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(root, "public/brand/reuno-logo.png");

if (!existsSync(SRC)) {
  console.error("Missing public/brand/reuno-logo.png — add the master logo first.");
  process.exit(1);
}

// Brand values mirrored from app/globals.css (scripts can't read CSS variables).
const BG = "#010619"; // --bg-0
const SILVER = "#D9DCE4"; // --silver-200
const INK2 = "#A3B8DB"; // --ink-2

async function square(size, out) {
  await sharp(SRC).resize(size, size, { fit: "cover" }).png().toFile(resolve(root, out));
  console.log("wrote", out);
}

await square(512, "app/icon.png");
await square(180, "app/apple-icon.png");
await square(32, "public/favicon-32.png");
await square(16, "public/favicon-16.png");

// Open Graph 1200x630: logo 420px at x=120, vertically centred; text to the right.
const W = 1200;
const H = 630;
const LOGO = 420;
const logoTop = Math.round((H - LOGO) / 2);

// Soft radial fade so the logo's own navy square blends into the background.
const fade = Buffer.from(
  `<svg width="${LOGO}" height="${LOGO}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="72%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`,
);
const logo = await sharp(SRC)
  .resize(LOGO, LOGO)
  .ensureAlpha()
  .composite([{ input: fade, blend: "dest-in" }])
  .png()
  .toBuffer();

const textX = 120 + LOGO + 48;
const overlay = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="28%" cy="50%" r="45%">
        <stop offset="0%" stop-color="#0A3A8C" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    <text x="${textX}" y="${H / 2 - 10}" font-family="Space Grotesk, Segoe UI, Helvetica, Arial, sans-serif"
      font-size="96" font-weight="700" letter-spacing="-2" fill="${SILVER}">reuno</text>
    <text x="${textX}" y="${H / 2 + 50}" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
      font-size="36" fill="${INK2}">
      <tspan x="${textX}" dy="0">Private rails for people</tspan>
      <tspan x="${textX}" dy="46">and their agents.</tspan>
    </text>
  </svg>`,
);

await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([
    { input: overlay, top: 0, left: 0 },
    { input: logo, top: logoTop, left: 120 },
  ])
  .png()
  .toFile(resolve(root, "app/opengraph-image.png"));
console.log("wrote app/opengraph-image.png");

// Same image for Twitter/X cards (summary_large_image).
await sharp(resolve(root, "app/opengraph-image.png")).toFile(resolve(root, "app/twitter-image.png"));
console.log("wrote app/twitter-image.png");
