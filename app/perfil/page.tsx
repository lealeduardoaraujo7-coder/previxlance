import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import FotoUpload from "./FotoUpload"

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const [user, bets, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.bet.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20, include: { market: true, option: true } }),
    prisma.transaction.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ])

  const totalApostado = bets.reduce((s, b) => s + b.amount, 0)
  const totalGanho = bets.reduce((s, b) => s + (b.payout ?? 0), 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <FotoUpload currentImage={user?.image} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500">{user?.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Saldo", value: brl(user?.balance ?? 0), color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total apostado", value: brl(totalApostado), color: "text-gray-900 dark:text-white" },
          { label: "Total ganho", value: brl(totalGanho), color: "text-gray-900 dark:text-white" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center shadow-sm">
            <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Apostas recentes</h2>
        {bets.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500">Nenhuma aposta ainda.</p>
        ) : (
          <div className="space-y-2">
            {bets.map((bet) => (
              <Link key={bet.id} href={`/mercados/${bet.marketId}`}>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{bet.market.title}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      <span className={`font-medium ${bet.option?.label === "SIM" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {bet.option?.label}
                      </span>
                      {" · "}{new Date(bet.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{brl(bet.amount)}</p>
                    {bet.payout != null ? (
                      <p className={`text-xs ${bet.payout > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-zinc-500"}`}>
                        {bet.payout > 0 ? `+${brl(bet.payout)}` : "Perdeu"}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Pendente</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Transações</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500">Nenhuma transação ainda.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{tx.type === "DEPOSIT" ? "Depósito" : "Saque"}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{new Date(tx.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.type === "DEPOSIT" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {tx.type === "DEPOSIT" ? "+" : "-"}{brl(tx.amount)}
                  </p>
                  <p className={`text-xs ${tx.status === "COMPLETED" ? "text-gray-400 dark:text-zinc-500" : tx.status === "PENDING" ? "text-yellow-500" : "text-red-500 dark:text-red-400"}`}>
                    {tx.status === "COMPLETED" ? "Concluído" : tx.status === "PENDING" ? "Pendente" : "Rejeitado"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
