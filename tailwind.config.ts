import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      bg: { 0: "var(--bg-0)", 1: "var(--bg-1)" },
      surface: { 1: "var(--surface-1)", 2: "var(--surface-2)", 3: "var(--surface-3)" },
      brand: {
        50: "var(--brand-50)",
        100: "var(--brand-100)",
        200: "var(--brand-200)",
        300: "var(--brand-300)",
        400: "var(--brand-400)",
        500: "var(--brand-500)",
        600: "var(--brand-600)",
        700: "var(--brand-700)",
        800: "var(--brand-800)",
        900: "var(--brand-900)",
      },
      silver: {
        100: "var(--silver-100)",
        200: "var(--silver-200)",
        300: "var(--silver-300)",
        400: "var(--silver-400)",
        500: "var(--silver-500)",
      },
      ink: { 1: "var(--ink-1)", 2: "var(--ink-2)", 3: "var(--ink-3)", inverse: "var(--ink-inverse)" },
      line: { 1: "var(--line-1)", 2: "var(--line-2)", 3: "var(--line-3)" },
      ok: "var(--ok)",
      warn: "var(--warn)",
      bad: "var(--bad)",
    },
    borderRadius: {
      none: "0",
      sm: "8px",
      md: "14px",
      lg: "20px",
      xl: "28px",
      full: "9999px",
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grad-brand": "var(--grad-brand)",
        "grad-text": "var(--grad-text)",
        "grad-silver": "var(--grad-silver)",
        "grad-glow": "var(--grad-glow)",
        "grad-card": "var(--grad-card)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "glow-brand": "var(--glow-brand)",
        "glow-soft": "var(--glow-soft)",
      },
      transitionTimingFunction: {
        reuno: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.6)", opacity: "0" },
        },
        dash: { to: { strokeDashoffset: "-200" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        dash: "dash 20s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
