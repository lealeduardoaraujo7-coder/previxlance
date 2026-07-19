/**
 * Pure event/market helpers — NO prisma import, so they are safe to use from
 * Client Components (e.g. the carousel). Prices now come from the LMSR engine
 * (lib/amm.ts): each option's probability is its LMSR price, derived from the
 * outstanding `shares` and the market's `liquidity`. Percentages across the
 * options of ONE market sum to 100%.
 */
import { priceCents } from "./amm"

type PriceOption = { label: string; shares: number }

/**
 * LMSR price (in cents, 0..100) of the option with `label`. Returns null when
 * the market is UNTRADED (all shares 0) — absence of trading is absence of a
 * price, not a coin-flip. The UI renders null as a muted "—", never a number.
 */
export function optionPct(options: PriceOption[], liquidity: number, label: string): number | null {
  if (!options.some((o) => o.shares > 0)) return null
  const idx = options.findIndex((o) => o.label === label)
  if (idx < 0) return null
  return priceCents(options.map((o) => o.shares), liquidity, idx)
}

/** SIM price (cents) of a binary market/child, or null when untraded. */
export function childYesPct(options: PriceOption[], liquidity: number): number | null {
  return optionPct(options, liquidity, "SIM")
}

/** Decimal payout odds from a probability; no price → "—x". */
export function oddsLabel(pct: number | null, hasPool: boolean): string {
  if (!hasPool || pct == null || pct <= 0) return "—x"
  return `${(100 / pct).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} x`
}

/** Whether a market has been traded at all (has any outstanding contracts). */
export function childHasPool(options: { shares: number }[]): boolean {
  return options.some((o) => o.shares > 0)
}

/** Event volume = sum of all children's pools. */
export function eventVolume(markets: { totalPool: number }[]): number {
  return markets.reduce((s, m) => s + (m.totalPool ?? 0), 0)
}

/** Children sorted by pool (most-traded first). */
export function sortChildrenByPool<T extends { totalPool: number }>(markets: T[]): T[] {
  return [...markets].sort((a, b) => (b.totalPool ?? 0) - (a.totalPool ?? 0))
}
