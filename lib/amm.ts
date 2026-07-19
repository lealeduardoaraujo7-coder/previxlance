/**
 * LMSR automated market maker — the pricing core of the live-price engine.
 *
 * Units (kept consistent to avoid money bugs):
 *  - A CONTRACT (share) pays 100 cents if its outcome wins, 0 otherwise.
 *  - `shares[i]` = number of contracts outstanding for outcome i (float, ≥ 0).
 *  - `b` = LMSR liquidity parameter, in contracts. Bigger b = deeper market
 *    (price moves less per trade) and larger max house subsidy = b·ln(n)·100 cents.
 *  - All money returned by this module is in CENTS.
 *
 * Prices always sum to 1 (→ 100¢), which matches the spec "NÃO = 100 − SIM".
 * This module is PURE (no prisma, no I/O) so it is unit-testable and safe on the
 * client if ever needed.
 */

/** Default liquidity (contracts) for a new market. Max house subsidy ≈ b·ln(2)·100¢ ≈ R$69 for binary. */
export const DEFAULT_LIQUIDITY = 100

/** House trading fee, taken on each buy and each sell. Configurable in one place. */
export const HOUSE_FEE = 0.02

/** LMSR cost function C(q) = b · ln(Σ exp(q_i/b)), scaled to CENTS (×100). Numerically stable. */
export function cost(shares: number[], b: number): number {
  const max = Math.max(...shares)
  const sumExp = shares.reduce((s, q) => s + Math.exp((q - max) / b), 0)
  return 100 * (max + b * Math.log(sumExp))
}

/** Instantaneous prices of each outcome in [0,1]. Sums to 1. */
export function prices(shares: number[], b: number): number[] {
  const max = Math.max(...shares)
  const exps = shares.map((q) => Math.exp((q - max) / b))
  const sum = exps.reduce((a, c) => a + c, 0)
  return exps.map((e) => e / sum)
}

/** Price of outcome i in whole cents (0..100), rounded. */
export function priceCents(shares: number[], b: number, i: number): number {
  return Math.round(prices(shares, b)[i] * 100)
}

/** Gross cost in cents to buy `delta` contracts of outcome i (before fee). */
function buyCost(shares: number[], b: number, i: number, delta: number): number {
  const q = shares.slice()
  q[i] += delta
  return cost(q, b) - cost(shares, b)
}

/**
 * Given money the buyer wants to SPEND (cents, fee included), return how many
 * contracts of outcome i they receive. Solved by binary search on the cost
 * function (monotonic increasing in delta).
 */
export function sharesForSpend(shares: number[], b: number, i: number, spendCents: number): number {
  if (spendCents <= 0) return 0
  const net = spendCents * (1 - HOUSE_FEE) // fee taken off the top
  let lo = 0
  let hi = 1
  // Expand the upper bound until it overshoots the target net cost.
  while (buyCost(shares, b, i, hi) < net) {
    hi *= 2
    if (hi > 1e12) break
  }
  for (let k = 0; k < 80; k++) {
    const mid = (lo + hi) / 2
    if (buyCost(shares, b, i, mid) < net) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** Exact gross cost in cents to buy `delta` contracts of outcome i (before fee, for records). */
export function costToBuy(shares: number[], b: number, i: number, delta: number): number {
  return buyCost(shares, b, i, delta)
}

/**
 * Proceeds in cents from SELLING `sellShares` contracts of outcome i (after fee).
 * Floored so the house never overpays by a rounding cent.
 */
export function proceedsForShares(shares: number[], b: number, i: number, sellShares: number): number {
  if (sellShares <= 0) return 0
  const q = shares.slice()
  q[i] = Math.max(0, q[i] - sellShares)
  const gross = cost(shares, b) - cost(q, b)
  return Math.floor(gross * (1 - HOUSE_FEE))
}
