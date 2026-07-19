/* Standalone sanity tests for the LMSR engine. Run: npx tsx scripts/test-amm.ts */
import {
  prices, priceCents, cost, sharesForSpend, proceedsForShares, costToBuy,
  DEFAULT_LIQUIDITY, HOUSE_FEE,
} from "../lib/amm"

let failures = 0
function check(name: string, cond: boolean, extra = "") {
  if (cond) console.log(`  ✓ ${name}`)
  else { console.log(`  ✗ ${name}  ${extra}`); failures++ }
}
const approx = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol

const b = DEFAULT_LIQUIDITY

console.log("LMSR engine tests (b =", b, ", fee =", HOUSE_FEE, ")")

// 1. Empty binary market → 50/50.
{
  const s = [0, 0]
  check("empty market is 50/50", approx(prices(s, b)[0], 0.5), `got ${prices(s, b)[0]}`)
  check("prices sum to 100¢", priceCents(s, b, 0) + priceCents(s, b, 1) === 100)
}

// 2. Buying SIM raises SIM price and lowers NÃO; still sums to 100.
{
  const s = [0, 0]
  const bought = sharesForSpend(s, b, 0, 5000) // spend R$50 on SIM
  s[0] += bought
  check("buying SIM raises SIM price above 50", priceCents(s, b, 0) > 50, `got ${priceCents(s, b, 0)}`)
  check("prices still sum to 100¢", priceCents(s, b, 0) + priceCents(s, b, 1) === 100,
    `got ${priceCents(s, b, 0)}+${priceCents(s, b, 1)}`)
  check("got a positive number of contracts", bought > 0, `got ${bought}`)
}

// 3. Fee is actually charged: net cost of contracts < money spent.
{
  const s = [0, 0]
  const spend = 10000 // R$100
  const bought = sharesForSpend(s, b, 0, spend)
  const grossCost = costToBuy(s, b, 0, bought)
  check("gross cost ≈ spend·(1−fee)", approx(grossCost, spend * (1 - HOUSE_FEE), 1),
    `gross ${grossCost.toFixed(2)} vs ${(spend * (1 - HOUSE_FEE)).toFixed(2)}`)
}

// 4. Buy then immediately sell back → you lose roughly both fees, never gain.
{
  const s = [0, 0]
  const spend = 10000
  const bought = sharesForSpend(s, b, 0, spend)
  s[0] += bought
  const back = proceedsForShares(s, b, 0, bought)
  check("round-trip returns less than spent (no free money)", back < spend, `back ${back} vs ${spend}`)
  // Exact expected loss for a symmetric round-trip = 1 − (1−fee)².
  const expected = Math.floor(spend * (1 - HOUSE_FEE) * (1 - HOUSE_FEE))
  check("round-trip loss equals two compounded fees", Math.abs(back - expected) <= 1,
    `back ${back} vs expected ${expected} (${((1 - back / spend) * 100).toFixed(2)}% loss)`)
}

// 5. Raw price never reaches 1 even for a huge one-sided buy (may round to 100¢).
{
  const s = [0, 0]
  const bought = sharesForSpend(s, b, 0, 100_000_00) // R$100k on SIM
  s[0] += bought
  const p = prices(s, b)
  check("prices stay within [0,1] and sum to 1 after huge buy",
    p[0] >= 0 && p[0] <= 1 && p[1] >= 0 && approx(p[0] + p[1], 1) && Number.isFinite(p[0]),
    `got [${p[0]}, ${p[1]}]`)
  check("huge buy pushes price to the ceiling (≥99¢)", priceCents(s, b, 0) >= 99, `got ${priceCents(s, b, 0)}`)
}

// 6. Selling more than you conceptually should still floors proceeds ≥ 0.
{
  const s = [200, 0]
  check("proceeds never negative", proceedsForShares(s, b, 0, 5) >= 0)
}

// 7. Cost function monotonic (more shares ⇒ higher cost).
{
  check("cost increases with shares", cost([10, 0], b) > cost([0, 0], b))
}

console.log(failures === 0 ? "\nALL PASSED ✅" : `\n${failures} FAILED ❌`)
process.exit(failures === 0 ? 0 : 1)
