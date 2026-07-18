import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import MarketImage from "@/app/components/MarketImage"
import EventActions from "./EventActions"

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export default async function EventosAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      categoryRef: true,
      markets: { select: { totalPool: true } },
      _count: { select: { markets: true } },
    },
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm" style={{ color: "var(--text-2)" }}>← Voltar ao painel</Link>
          <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--text-0)" }}>Eventos</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>Agrupam vários mercados num único card.</p>
        </div>
        <Link href="/admin/eventos/novo" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors">
          + Novo Evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <p className="text-gray-400 dark:text-zinc-500">Nenhum evento criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const vol = ev.markets.reduce((s, m) => s + (m.totalPool ?? 0), 0)
            return (
              <div key={ev.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
                <MarketImage imageUrl={ev.imageUrl} category={ev.categoryRef} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] uppercase font-semibold" style={{ color: "var(--text-2)", letterSpacing: "0.06em" }}>
                      {ev.categoryRef?.name ?? ev.category}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--text-2)" }}>· {ev.status}</span>
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-0)" }}>{ev.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                    {ev._count.markets} mercado(s) · {brl(vol)} pool{ev.collection ? ` · ${ev.collection}` : ""}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Link href={`/admin/eventos/${ev.id}/editar`} className="rounded-lg px-3 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors">
                    Editar
                  </Link>
                  <EventActions id={ev.id} title={ev.title} childCount={ev._count.markets} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
