/**
 * Pure event/market helpers — NO prisma import, so they are safe to use from
 * Client Components (e.g. the carousel). Decision (b): each child shows its RAW
 * probability from its own pool; percentages across siblings do not sum to 100%.
 */

type OptionLike = { label: string; totalBet: number }

/**
 * Raw SIM probability of a binary child. Returns null when there is NO pool —
 * absence of a pool is absence of a price, not a 50% chance. The UI renders
 * null as a muted "—", never as a number.
 */
export function childYesPct(options: OptionLike[]): number | null {
  const yes = options.find((o) => o.label === "SIM")?.totalBet ?? 0
  const no = options.find((o) => o.label === "NÃO")?.totalBet ?? 0
  const pool = yes + no
  return pool > 0 ? Math.round((yes / pool) * 100) : null
}

/** Decimal payout odds from a probability; no price → "—x". */
export function oddsLabel(pct: number | null, hasPool: boolean): string {
  if (!hasPool || pct == null || pct <= 0) return "—x"
  return `${(100 / pct).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} x`
}

/** Whether a binary child has any stake at all. */
export function childHasPool(options: OptionLike[]): boolean {
  return options.some((o) => o.totalBet > 0)
}

/** Event volume = sum of all children's pools. */
export function eventVolume(markets: { totalPool: number }[]): number {
  return markets.reduce((s, m) => s + (m.totalPool ?? 0), 0)
}

/** Children sorted by pool (most-traded first). */
export function sortChildrenByPool<T extends { totalPool: number }>(markets: T[]): T[] {
  return [...markets].sort((a, b) => (b.totalPool ?? 0) - (a.totalPool ?? 0))
}
