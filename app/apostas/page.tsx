import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { priceCents } from "@/lib/amm"
import PortfolioTabs from "./PortfolioTabs"

function brl(n: number) { return (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }

export default async function MinhasPosicoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  const userId = session.user.id

  const [positions, costAgg, user] = await Promise.all([
    prisma.position.findMany({
      where: { userId, shares: { gt: 0.0001 } },
      include: { market: { include: { options: true } }, option: { select: { label: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.bet.groupBy({ by: ["optionId", "side"], where: { userId }, _sum: { amount: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
  ])

  // Net cash still invested per option = Σ BUY − Σ SELL (cost basis of the open position).
  const costByOption: Record<string, number> = {}
  for (const row of costAgg) {
    if (!row.optionId) continue
    const amt = row._sum.amount ?? 0
    costByOption[row.optionId] = (costByOption[row.optionId] ?? 0) + (row.side === "SELL" ? -amt : amt)
  }

  // Only live positions (OPEN/CLOSED markets) carry a current value + P&L.
  const live = positions.filter((p) => p.market.status === "OPEN" || p.market.status === "CLOSED")
  const rows = live.map((p) => {
    const idx = p.market.options.findIndex((o) => o.id === p.optionId)
    const price = idx >= 0 ? priceCents(p.market.options.map((o) => o.shares), p.market.liquidity, idx) : 0
    const value = Math.round(p.shares * price)
    const cost = Math.max(0, costByOption[p.optionId] ?? 0)
    const pnl = value - cost
    return { p, price, value, cost, pnl }
  })

  const positionsValue = rows.reduce((s, r) => s + r.value, 0)
  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0)
  const balance = user?.balance ?? 0

  const card = { background: "var(--card)", border: "1px solid var(--border)" } as const

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-0)" }}>Minhas posições</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>Seus contratos com preço ao vivo e lucro/prejuízo.</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Saldo", value: brl(balance), color: "var(--text-0)" },
          { label: "Em posições", value: brl(positionsValue), color: "var(--text-0)" },
          { label: "Lucro aberto", value: `${totalPnl >= 0 ? "+" : ""}${brl(totalPnl)}`, color: totalPnl >= 0 ? "var(--green)" : "var(--red)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3.5" style={card}>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>{s.label}</p>
            <p className="text-base font-bold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* CARGOS · PEDIDOS · HISTÓRIA */}
      <PortfolioTabs />
    </div>
  )
}
