/* End-to-end trade/resolve test against dev.db. Run: DATABASE_URL="file:./dev.db" npx tsx scripts/test-trade.ts */
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { sharesForSpend, proceedsForShares, priceCents, DEFAULT_LIQUIDITY, HOUSE_FEE } from "../lib/amm"

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

let failures = 0
function check(name: string, cond: boolean, extra = "") {
  if (cond) console.log(`  ✓ ${name}`)
  else { console.log(`  ✗ ${name}  ${extra}`); failures++ }
}

async function main() {
  console.log("Trade engine integration test (dev.db)")

  // Ensure a category exists (Market.category FK → Category.slug).
  await prisma.category.upsert({
    where: { slug: "outros" }, update: {}, create: { slug: "outros", name: "Outros" },
  })

  const user = await prisma.user.create({
    data: { email: `test-trade-${Date.now()}@x.com`, name: "Trade Tester", balance: 100_000 }, // R$1000
  })
  const market = await prisma.market.create({
    data: {
      title: "TEST market", category: "outros", type: "BINARY", liquidity: DEFAULT_LIQUIDITY,
      closesAt: new Date(Date.now() + 86_400_000),
      options: { create: [{ label: "SIM" }, { label: "NÃO" }] },
    },
    include: { options: true },
  })
  const sim = market.options.find((o) => o.label === "SIM")!
  const b = market.liquidity

  /* ── BUY R$50 on SIM ── */
  const spend = 5000
  {
    const q = market.options.map((o) => o.shares)
    const idx = market.options.findIndex((o) => o.id === sim.id)
    const bought = sharesForSpend(q, b, idx, spend)
    await prisma.$transaction([
      prisma.bet.create({ data: { userId: user.id, marketId: market.id, optionId: sim.id, side: "BUY", amount: spend, shares: bought, price: Math.round(spend / bought) } }),
      prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: spend } } }),
      prisma.marketOption.update({ where: { id: sim.id }, data: { shares: { increment: bought }, totalBet: { increment: spend } } }),
      prisma.market.update({ where: { id: market.id }, data: { totalPool: { increment: spend } } }),
      prisma.position.upsert({ where: { userId_optionId: { userId: user.id, optionId: sim.id } }, create: { userId: user.id, marketId: market.id, optionId: sim.id, shares: bought }, update: { shares: { increment: bought } } }),
    ])

    const u = await prisma.user.findUnique({ where: { id: user.id } })
    const opt = await prisma.marketOption.findUnique({ where: { id: sim.id } })
    const pos = await prisma.position.findUnique({ where: { userId_optionId: { userId: user.id, optionId: sim.id } } })
    check("balance debited by spend", u!.balance === 100_000 - spend, `bal ${u!.balance}`)
    check("position shares == contracts bought", Math.abs(pos!.shares - bought) < 1e-9)
    check("option shares == position shares (invariant)", Math.abs(opt!.shares - pos!.shares) < 1e-9)
    const opts = await prisma.marketOption.findMany({ where: { marketId: market.id }, orderBy: { label: "asc" } })
    check("SIM price rose above 50¢ after buy", priceCents(opts.map((o) => o.shares), b, opts.findIndex((o) => o.label === "SIM")) > 50)
  }

  /* ── SELL half back ── */
  {
    const pos = (await prisma.position.findUnique({ where: { userId_optionId: { userId: user.id, optionId: sim.id } } }))!
    const opts = await prisma.marketOption.findMany({ where: { marketId: market.id } })
    const q = opts.map((o) => o.shares)
    const idx = opts.findIndex((o) => o.id === sim.id)
    const sell = pos.shares / 2
    const proceeds = proceedsForShares(q, b, idx, sell)
    const balBefore = (await prisma.user.findUnique({ where: { id: user.id } }))!.balance
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { balance: { increment: proceeds } } }),
      prisma.marketOption.update({ where: { id: sim.id }, data: { shares: Math.max(0, opts[idx].shares - sell) } }),
      prisma.position.update({ where: { userId_optionId: { userId: user.id, optionId: sim.id } }, data: { shares: pos.shares - sell } }),
    ])
    const u = await prisma.user.findUnique({ where: { id: user.id } })
    check("balance credited by sell proceeds", u!.balance === balBefore + proceeds, `bal ${u!.balance} vs ${balBefore + proceeds}`)
    check("sell proceeds are positive and < spent", proceeds > 0 && proceeds < spend, `proceeds ${proceeds}`)
  }

  /* ── RESOLVE SIM wins ── */
  {
    const balBefore = (await prisma.user.findUnique({ where: { id: user.id } }))!.balance
    const winningPositions = await prisma.position.findMany({ where: { marketId: market.id, optionId: sim.id } })
    const pos = winningPositions[0]
    const payout = Math.round(pos.shares * 100)
    await prisma.$transaction(async (tx) => {
      await tx.market.update({ where: { id: market.id }, data: { status: "RESOLVED", resolution: "SIM", resolvedAt: new Date() } })
      await tx.user.update({ where: { id: pos.userId }, data: { balance: { increment: payout } } })
    })
    const u = await prisma.user.findUnique({ where: { id: user.id } })
    check("winner paid remaining shares × 100¢", u!.balance === balBefore + payout, `bal ${u!.balance} vs ${balBefore + payout}`)

    // Money-conservation sanity: with SIM at ~50¢ entry, R$50 buys ~1 contract worth ~R$1 on win.
    // Net user P&L should be modest; house keeps fees. Just report it.
    const netUser = u!.balance - 100_000
    console.log(`  · net user P&L over the round: ${(netUser / 100).toFixed(2)} (fee=${HOUSE_FEE})`)
  }

  // Cleanup
  await prisma.bet.deleteMany({ where: { marketId: market.id } })
  await prisma.position.deleteMany({ where: { marketId: market.id } })
  await prisma.marketOption.deleteMany({ where: { marketId: market.id } })
  await prisma.market.delete({ where: { id: market.id } })
  await prisma.user.delete({ where: { id: user.id } })

  console.log(failures === 0 ? "\nALL PASSED ✅" : `\n${failures} FAILED ❌`)
  await prisma.$disconnect()
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
