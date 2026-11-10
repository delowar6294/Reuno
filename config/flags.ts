/**
 * Feature flags for blocks that need Reuno's own contracts, relayers or
 * services to be live. While a flag is false the block renders no numbers,
 * only a static explanation (or nothing). Flip a flag only once the block is
 * wired to a real data source.
 */
export const FLAGS = {
  /** Live transfer card in the home hero (needs Reuno pool + relayers). */
  liveTransferCard: false,
  /** Recent transfers ticker strip (needs pool indexer). */
  recentTransfers: false,
  /** Per-transfer trace timeline with minutes (needs pool indexer). */
  traceTimeline: false,
  /** Tor session stats (needs the .onion service). */
  torSessionStats: false,
  /** Weekly pool deposit chart (needs pool indexer). */
  crowdChart: false,
  /** Traceability percentages per layer (needs audited measurements). */
  traceOdds: false,
  /** Pool heatmap, relayers online, next batch, full-stack % (needs pool + relayers). */
  poolActivity: false,
  /** Relayer world map (needs relayer registry). */
  relayerMap: false,
  /** "All systems normal" status line (needs a status page). */
  statusLine: false,
  /** Agent key issuing (needs the Reuno API backend). */
  agentKeys: false,
  /** Private transfers in /app (needs Reuno pool contracts). */
  privateTransfers: false,
} as const;
