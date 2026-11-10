import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ModalProvider } from "@/components/modals/ModalProvider";
import { THEME_COLOR } from "@/data/site";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const DESCRIPTION =
  "Private swaps and transfers on Robinhood Chain through five privacy layers and Tor, plus one key for AI agents: 300+ models and stock-token tools. Your keys never leave your wallet.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Reuno · Private rails for people and their agents",
    template: "%s · Reuno",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Reuno",
    title: "Reuno · Private rails for people and their agents",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Reuno · Private rails for people and their agents",
    description: DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-3 z-[200] rounded-md bg-grad-brand px-4 py-2 text-sm font-medium text-ink-inverse"
        >
          Skip to content
        </a>
        <ModalProvider>
          <Navbar />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
        </ModalProvider>
      </body>
    </html>
  );
}
