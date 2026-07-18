import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import ApproveButtons from "./ApproveButtons"

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function AdminSaquesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const [pending, completed] = await Promise.all([
    prisma.transaction.findMany({
      where: { type: "WITHDRAWAL", status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.transaction.findMany({
      where: { type: "WITHDRAWAL", status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Saques pendentes</h1>

      {pending.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-10">Nenhum saque pendente.</p>
      ) : (
        <div className="space-y-3 mb-10">
          {pending.map((tx) => {
            const fee = Math.round(tx.amount * 0.01)
            const net = tx.amount - fee
            return (
              <div key={tx.id} className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{tx.user.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{tx.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{brl(tx.amount)}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">Líquido: {brl(net)}</p>
                  </div>
                </div>
                <div className="mb-4 space-y-1">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    <span className="text-gray-400 dark:text-zinc-500">Chave PIX:</span>{" "}
                    <span className="font-mono">{tx.pixKey}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{new Date(tx.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                <ApproveButtons transactionId={tx.id} />
              </div>
            )
          })}
        </div>
      )}

      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Histórico</h2>
      {completed.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-zinc-500">Nenhum saque processado ainda.</p>
      ) : (
        <div className="space-y-2">
          {completed.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
              <div>
                <p className="text-sm text-gray-900 dark:text-white">{tx.user.name}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{new Date(tx.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{brl(tx.amount)}</p>
                <p className={`text-xs ${tx.status === "COMPLETED" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                  {tx.status === "COMPLETED" ? "Aprovado" : "Rejeitado"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
