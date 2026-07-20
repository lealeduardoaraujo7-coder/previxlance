import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { priceCents } from "@/lib/amm"

/**
 * Portfolio data for the CARGOS · PEDIDOS · HISTÓRIA tabs. All money in cents.
 *
 * Note on the AMM model: resolution credits each winning Position at 100¢ and does
 * NOT write Bet.payout. So "pagamento" is derived from the remaining Positions —
 * settled at 100¢ when the market resolved in the option's favour, otherwise
 * marked to market at the current LMSR price. Bets remain the raw order history.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  const userId = session.user.id

  const [positions, bets] = await Promise.all([
    prisma.position.findMany({
      where: { userId, shares: { gt: 0 } },
      include: { market: { include: { options: true } }, option: true },
    }),
    prisma.bet.findMany({
      where: { userId },
      include: { market: { select: { id: true, title: true, status: true } }, option: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  function positionValue(p: (typeof positions)[number]): number {
    const m = p.market
    if (m.status === "RESOLVED") return m.resolution === p.option.label ? Math.round(p.shares * 100) : 0
    const idx = m.options.findIndex((o) => o.id === p.optionId)
    if (idx < 0) return 0
    return Math.round(p.shares * priceCents(m.options.map((o) => o.shares), m.liquidity, idx))
  }

  // CARGOS — posições abertas com valor atual (shares × preço LMSR)
  const cargos = positions
    .filter((p) => p.market.status === "OPEN")
    .map((p) => {
      const idx = p.market.options.findIndex((o) => o.id === p.optionId)
      const preco = idx >= 0 ? priceCents(p.market.options.map((o) => o.shares), p.market.liquidity, idx) : 0
      return {
        marketId: p.marketId,
        mercado: p.market.title,
        opcao: p.option.label,
        shares: p.shares,
        precoAtual: preco,
        valorAtual: Math.round(p.shares * preco),
      }
    })

  // PEDIDOS — ordens executadas (trades brutos)
  const pedidos = bets.map((b) => ({
    marketId: b.marketId,
    mercado: b.market.title,
    lado: b.side,
    resultado: b.option?.label ?? b.outcome ?? "—",
    valor: b.amount,
    shares: b.shares,
    preco: b.price,
    data: b.createdAt,
  }))

  // HISTÓRIA — agrupado por mercado
  const grupos = new Map<string, { marketId: string; titulo: string; status: string; custo: number; pagamento: number }>()
  for (const b of bets) {
    const g = grupos.get(b.marketId) ?? { marketId: b.marketId, titulo: b.market.title, status: b.market.status, custo: 0, pagamento: 0 }
    g.custo += b.side === "SELL" ? -b.amount : b.amount // custo líquido (compras − vendas)
    grupos.set(b.marketId, g)
  }
  for (const p of positions) {
    const g = grupos.get(p.marketId)
    if (g) g.pagamento += positionValue(p) // valor liquidado/atual das posições restantes
  }
  const historia = [...grupos.values()].map((g) => {
    const retorno = g.pagamento - g.custo
    return {
      marketId: g.marketId,
      mercado: g.titulo,
      status: g.status,
      custoTotal: g.custo,
      pagamentoTotal: g.pagamento,
      retornoTotal: retorno,
      retornoPct: g.custo > 0 ? Math.round((retorno / g.custo) * 100) : 0,
    }
  })

  return NextResponse.json({ cargos, pedidos, historia })
}
