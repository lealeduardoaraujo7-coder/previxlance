import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sharesForSpend, proceedsForShares, priceCents } from "@/lib/amm"
import { closeExpiredMarkets } from "@/lib/marketClose"

/**
 * Trade endpoint (LMSR engine). Replaces the old pool-bet logic.
 *
 *  BUY : body { marketId, optionId, side: "BUY", amount }  — `amount` = cash in cents.
 *        Returns the contracts bought; balance is debited by `amount`.
 *  SELL: body { marketId, optionId, side: "SELL", shares } — `shares` = contracts to sell.
 *        Balance is credited by the LMSR proceeds (after fee).
 *
 * Prices are derived from each option's outstanding `shares` (q_i) and the
 * market's `liquidity` (b). See lib/amm.ts. `totalPool`/`totalBet` now track
 * traded VOLUME (display only), not a prize pool.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { marketId, optionId, side = "BUY", amount, shares } = await req.json()

  // Halt trading on any market past its deadline before we read it, so the
  // status check below rejects expired markets (no late bets, no late sells).
  await closeExpiredMarkets()

  const [market, user] = await Promise.all([
    prisma.market.findUnique({ where: { id: marketId }, include: { options: true } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])

  if (!market || market.status !== "OPEN") {
    return NextResponse.json({ error: "Mercado não disponível" }, { status: 400 })
  }
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 400 })

  const idx = market.options.findIndex((o) => o.id === optionId)
  if (idx < 0) return NextResponse.json({ error: "Opção inválida" }, { status: 400 })

  const b = market.liquidity
  const q = market.options.map((o) => o.shares)

  /* ── BUY ──────────────────────────────────────────────────────────── */
  if (side === "BUY") {
    const spend = Math.round(Number(amount))
    if (!spend || spend < 100) {
      return NextResponse.json({ error: "Valor mínimo: R$ 1,00" }, { status: 400 })
    }
    if (user.balance < spend) {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })
    }

    const bought = sharesForSpend(q, b, idx, spend)
    if (!(bought > 0)) {
      return NextResponse.json({ error: "Valor muito baixo para comprar contratos" }, { status: 400 })
    }
    const pricePer = Math.round(spend / bought) // effective ¢/contract

    await prisma.$transaction([
      prisma.bet.create({
        data: { userId: user.id, marketId, optionId, side: "BUY", amount: spend, shares: bought, price: pricePer },
      }),
      prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: spend } } }),
      prisma.marketOption.update({
        where: { id: optionId },
        data: { shares: { increment: bought }, totalBet: { increment: spend } },
      }),
      prisma.market.update({ where: { id: marketId }, data: { totalPool: { increment: spend } } }),
      prisma.position.upsert({
        where: { userId_optionId: { userId: user.id, optionId } },
        create: { userId: user.id, marketId, optionId, shares: bought },
        update: { shares: { increment: bought } },
      }),
    ])

    const newQ = q.slice()
    newQ[idx] += bought
    const updated = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } })
    return NextResponse.json({
      ok: true,
      side: "BUY",
      shares: bought,
      price: pricePer,
      balance: updated?.balance ?? 0,
      priceCents: priceCents(newQ, b, idx),
    })
  }

  /* ── SELL ─────────────────────────────────────────────────────────── */
  if (side === "SELL") {
    const sell = Number(shares)
    if (!(sell > 0)) return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 })

    const position = await prisma.position.findUnique({
      where: { userId_optionId: { userId: user.id, optionId } },
    })
    if (!position || position.shares + 1e-9 < sell) {
      return NextResponse.json({ error: "Você não tem contratos suficientes para vender" }, { status: 400 })
    }

    const proceeds = proceedsForShares(q, b, idx, sell)
    const pricePer = proceeds > 0 ? Math.round(proceeds / sell) : 0
    // Clamp the option's shares at 0 to avoid float drift below zero.
    const newOptionShares = Math.max(0, market.options[idx].shares - sell)
    const newPositionShares = Math.max(0, position.shares - sell)

    await prisma.$transaction([
      prisma.bet.create({
        data: { userId: user.id, marketId, optionId, side: "SELL", amount: proceeds, shares: sell, price: pricePer },
      }),
      prisma.user.update({ where: { id: user.id }, data: { balance: { increment: proceeds } } }),
      prisma.marketOption.update({
        where: { id: optionId },
        data: { shares: newOptionShares, totalBet: { increment: proceeds } },
      }),
      prisma.market.update({ where: { id: marketId }, data: { totalPool: { increment: proceeds } } }),
      prisma.position.update({
        where: { userId_optionId: { userId: user.id, optionId } },
        data: { shares: newPositionShares },
      }),
    ])

    const newQ = q.slice()
    newQ[idx] = newOptionShares
    const updated = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } })
    return NextResponse.json({
      ok: true,
      side: "SELL",
      proceeds,
      price: pricePer,
      balance: updated?.balance ?? 0,
      priceCents: priceCents(newQ, b, idx),
    })
  }

  return NextResponse.json({ error: "Operação inválida" }, { status: 400 })
}
