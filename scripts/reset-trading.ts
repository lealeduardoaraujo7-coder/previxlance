/**
 * One-shot reset for the AMM cutover. Wipes all TRADING state (bets, positions,
 * outstanding shares, volumes) while KEEPING markets, users, categories, events.
 * Run once, right after the amm_engine migration is applied:
 *
 *   DATABASE_URL="<prod url>" TURSO_AUTH_TOKEN="<token>" npx tsx scripts/reset-trading.ts
 *
 * Idempotent — safe to run more than once.
 */
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Resetting trading state for the AMM cutover…")

  const bets = await prisma.bet.deleteMany({})
  const positions = await prisma.position.deleteMany({})
  const opts = await prisma.marketOption.updateMany({ data: { shares: 0, totalBet: 0 } })
  const markets = await prisma.market.updateMany({ data: { totalPool: 0 } })

  console.log(`  · bets removed:      ${bets.count}`)
  console.log(`  · positions removed: ${positions.count}`)
  console.log(`  · options zeroed:    ${opts.count}`)
  console.log(`  · markets zeroed:    ${markets.count}`)
  console.log("Done ✅  (markets, users, categories and events were kept)")

  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
