import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

function brl(n: number) { return (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }

export default async function MinhasApostasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      market: { select: { id: true, title: true, status: true, resolution: true } },
      option: { select: { label: true } },
    },
  })

  function statusLabel(bet: (typeof bets)[0]) {
    if (bet.market.status === "OPEN" || bet.market.status === "CLOSED") return { text: "Em andamento", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" }
    if (bet.market.status === "CANCELLED") return { text: "Cancelado", color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10" }
    const won = bet.option?.label === bet.market.resolution || bet.outcome === bet.market.resolution
    return won
      ? { text: "Ganhou", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" }
      : { text: "Perdeu", color: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10" }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas apostas</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{bets.length} aposta{bets.length !== 1 ? "s" : ""} no total</p>
      </div>

      {bets.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <p className="text-gray-400 dark:text-zinc-500 mb-4">Você ainda não fez nenhuma aposta.</p>
          <Link href="/" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors">
            Ver mercados
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bets.map((bet) => {
            const status = statusLabel(bet)
            const isWon = status.text === "Ganhou"
            return (
              <Link key={bet.id} href={`/mercados/${bet.market.id}`}
                className="block rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 shadow-sm hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug truncate">{bet.market.title}</p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                      Aposta: <span className="text-gray-600 dark:text-zinc-300 font-medium">{bet.option?.label ?? bet.outcome ?? "—"}</span>
                      {" · "}{new Date(bet.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{brl(bet.amount)}</p>
                    {bet.payout != null && bet.payout > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+{brl(bet.payout)}</p>
                    )}
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
