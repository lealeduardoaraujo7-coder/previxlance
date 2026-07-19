import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { priceCents } from "@/lib/amm"

function brl(n: number) { return (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }
function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}m atrás`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h atrás`
  return `${Math.floor(diff / 86_400_000)}d atrás`
}

export default async function MinhasPosicoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  const userId = session.user.id

  const [positions, costAgg, history, user] = await Promise.all([
    prisma.position.findMany({
      where: { userId, shares: { gt: 0.0001 } },
      include: { market: { include: { options: true } }, option: { select: { label: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.bet.groupBy({ by: ["optionId", "side"], where: { userId }, _sum: { amount: true } }),
    prisma.bet.findMany({
      where: { userId }, orderBy: { createdAt: "desc" }, take: 25,
      include: { market: { select: { id: true, title: true } }, option: { select: { label: true } } },
    }),
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

      {/* Open positions */}
      {rows.length === 0 ? (
        <div className="rounded-2xl p-12 text-center mb-8" style={card}>
          <p className="mb-4" style={{ color: "var(--text-2)" }}>Você ainda não tem posições abertas.</p>
          <Link href="/" className="inline-block rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#00c076,#009e64)" }}>Explorar mercados</Link>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden mb-8" style={card}>
          {rows.map(({ p, price, value, pnl }, i) => {
            const isNao = p.option?.label === "NÃO"
            const clr = isNao ? "var(--red)" : "var(--green)"
            const dim = isNao ? "var(--red-dim)" : "var(--green-dim)"
            return (
              <Link key={p.id} href={`/mercados/${p.marketId}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--card-2)]"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-0)" }}>{p.market.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: dim, color: clr }}>{p.option?.label}</span>
                    <span className="text-[11px] tabular-nums" style={{ color: "var(--text-2)" }}>{p.shares.toFixed(1)} contratos · {price}¢</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-0)" }}>{brl(value)}</p>
                  <p className="text-[11px] font-semibold tabular-nums" style={{ color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                    {pnl >= 0 ? "+" : ""}{brl(pnl)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Trade history */}
      {history.length > 0 && (
        <>
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text-0)" }}>Histórico</h2>
          <div className="rounded-2xl overflow-hidden" style={card}>
            {history.map((b, i) => {
              const isNao = b.option?.label === "NÃO"
              const clr = isNao ? "var(--red)" : "var(--green)"
              return (
                <Link key={b.id} href={`/mercados/${b.market.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--card-2)]"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-medium truncate" style={{ color: "var(--text-0)" }}>{b.market.title}</p>
                    <p className="mt-0.5" style={{ color: "var(--text-2)" }}>
                      {b.side === "SELL" ? "Vendeu" : "Comprou"} <span style={{ color: clr }}>{b.option?.label}</span> · {timeAgo(b.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums ml-3" style={{ color: b.side === "SELL" ? "var(--green)" : "var(--text-0)" }}>
                    {b.side === "SELL" ? "+" : "−"}{brl(b.amount)}
                  </span>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
