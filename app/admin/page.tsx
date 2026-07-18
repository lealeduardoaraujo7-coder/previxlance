import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import MarketActions from "./components/MarketActions"
import PendingMarketActions from "./components/PendingMarketActions"
import MarketImage from "@/app/components/MarketImage"
import SeedButton from "./components/SeedButton"

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const [markets, pendingMarkets, pendingWithdrawals, totalUsers, totalBets, totalPoolAgg] = await Promise.all([
    prisma.market.findMany({ where: { status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, include: { _count: { select: { bets: true } }, categoryRef: true } }),
    prisma.market.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { options: true, categoryRef: true } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", status: "PENDING" } }),
    prisma.user.count(),
    prisma.bet.count(),
    prisma.market.aggregate({ _sum: { totalPool: true } }),
  ])

  const totalPool = totalPoolAgg._sum.totalPool ?? 0
  const openMarkets = markets.filter((m) => m.status === "OPEN").length

  const statCard = "rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center shadow-sm"

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Admin</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Gerencie mercados e saques</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/eventos" className="rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors">
            Eventos
          </Link>
          <Link href="/admin/categorias" className="rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors">
            Categorias
          </Link>
          <Link href="/admin/manchete" className="rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors">
            Manchete
          </Link>
          <Link href="/admin/saques" className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
            pendingWithdrawals > 0
              ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-500/20"
              : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
          }`}>
            Saques{pendingWithdrawals > 0 ? ` (${pendingWithdrawals})` : ""}
          </Link>
          <Link href="/admin/mercados/novo" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors">
            + Novo Mercado
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className={statCard}>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Usuários</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
        </div>
        <div className={statCard}>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Mercados abertos</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{openMarkets}</p>
        </div>
        <div className={statCard}>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Total de apostas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBets}</p>
        </div>
        <div className={statCard}>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Volume total</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{brl(totalPool)}</p>
        </div>
      </div>

      {/* Pending proposals */}
      {pendingMarkets.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Propostas aguardando aprovação
              <span className="ml-2 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs px-2 py-0.5 font-medium">
                {pendingMarkets.length}
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {pendingMarkets.map((market) => (
              <div key={market.id} className="flex items-start justify-between rounded-2xl border border-orange-200 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-500/5 px-5 py-4 shadow-sm gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-orange-500 dark:text-orange-400 uppercase font-medium">
                      Pendente · {market.categoryRef?.name ?? market.category} · {market.type === "BINARY" ? "Sim/Não" : "Múltipla"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{market.title}</p>
                  {market.proposedByName && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      Por {market.proposedByName}
                      {market.proposedByEmail ? ` (${market.proposedByEmail})` : ""}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    Opções: {market.options.map((o) => o.label).join(", ")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <PendingMarketActions marketId={market.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All markets */}
      <div className="space-y-3">
        {markets.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
            <p className="text-gray-400 dark:text-zinc-500 mb-4">Nenhum mercado criado ainda.</p>
            <div className="flex justify-center"><SeedButton /></div>
          </div>
        ) : markets.map((market) => (
          <div key={market.id} className="flex items-start justify-between rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 shadow-sm gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <MarketImage imageUrl={market.imageUrl} category={market.categoryRef} size={32} />
              <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                  market.status === "OPEN" ? "bg-emerald-500" :
                  market.status === "CLOSED" ? "bg-yellow-400" :
                  market.status === "CANCELLED" ? "bg-red-400" :
                  "bg-gray-300 dark:bg-zinc-600"
                }`} />
                <span className="text-xs text-gray-400 dark:text-zinc-500 uppercase">
                  {market.status === "CANCELLED" ? "Cancelado" : market.status} · {market.categoryRef?.name ?? market.category} · {market.type === "BINARY" ? "Sim/Não" : "Múltipla"}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{market.title}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{market._count.bets} apostas · Pool: {brl(market.totalPool)}</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <MarketActions marketId={market.id} status={market.status} betCount={market._count.bets} featured={market.featured} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
