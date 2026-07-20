import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import MarketImage from "@/app/components/MarketImage"
import { volLabel } from "@/app/components/cardParts"
import { getEventBySlug, eventVolume } from "@/lib/events"
import { closeExpiredMarkets } from "@/lib/marketClose"
import EventTradeView, { type EventOutcome } from "./EventTradeView"

/** Normalize for comparison: lowercase, strip accents, collapse whitespace. */
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, " ").trim()
}
/** The secondary title only adds value when it isn't just the short label again. */
function titleAddsInfo(shortLabel: string | null, title: string) {
  if (!shortLabel) return true
  return norm(shortLabel) !== norm(title)
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  await closeExpiredMarkets()
  const [event, session] = await Promise.all([getEventBySlug(slug), getServerSession(authOptions)])
  if (!event) notFound()

  const children = event.markets // already sorted by pool desc
  const openCount = children.filter((m) => m.status === "OPEN").length
  const vol = eventVolume(children)

  // User positions across this event's markets (for the SELL tab).
  const positions = session && children.length
    ? await prisma.position.findMany({ where: { userId: session.user.id, marketId: { in: children.map((c) => c.id) } } })
    : []
  const posMap: Record<string, Record<string, number>> = {}
  for (const p of positions) (posMap[p.marketId] ??= {})[p.optionId] = p.shares

  const outcomes: EventOutcome[] = children.map((c) => ({
    marketId: c.id,
    name: c.shortLabel || c.title,
    secondary: c.shortLabel && titleAddsInfo(c.shortLabel, c.title) ? c.title : null,
    imageUrl: c.shortImageUrl ?? c.imageUrl,
    vol: c.totalPool,
    liquidity: c.liquidity,
    options: c.options.map((o) => ({ id: o.id, label: o.label, shares: o.shares })),
    positions: posMap[c.id] ?? {},
  }))

  const closeDate = new Date(event.closesAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  }) + " às " + new Date(event.closesAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + "h"

  const bandColor = event.categoryRef?.color ?? "#8b98a5"

  return (
    <div>
      {/* Top color band — the event's tint. */}
      <div className="relative" style={{ background: `linear-gradient(180deg, ${bandColor}22 0%, transparent 100%)` }}>
        <div style={{ height: 3, background: bandColor }} />
        <div className="mx-auto max-w-5xl px-4 pt-5 pb-2">
          <Link href="/" className="text-sm" style={{ color: "var(--text-2)" }}>← Voltar</Link>
          <div className="mt-4 flex items-start gap-3.5">
            <MarketImage imageUrl={event.imageUrl} category={event.categoryRef} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--text-2)", letterSpacing: "0.08em" }}>
                  {event.categoryRef?.name ?? event.category}
                </span>
                {event.collection && <span className="text-[12px]" style={{ color: "var(--text-2)" }}>· {event.collection}</span>}
              </div>
              <h1 className="text-[26px] font-semibold mt-1" style={{ color: "var(--text-0)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {event.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-10">
        {/* Meta line */}
        <div className="mt-4 mb-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]" style={{ color: "var(--text-2)" }}>
          <span>Fecha em <span style={{ color: "var(--text-1)" }}>{closeDate}</span></span>
          <span className="tabular-nums">{volLabel(vol)} <span>volume</span></span>
          <span className="tabular-nums">{openCount} {openCount === 1 ? "mercado" : "mercados"}</span>
        </div>

        {event.description && (
          <p className="mb-6 text-[14px] leading-relaxed" style={{ color: "var(--text-1)" }}>{event.description}</p>
        )}

        {children.length === 0 ? (
          <div className="rounded-xl p-10 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Nenhum mercado neste evento ainda.</p>
          </div>
        ) : (
          <>
            <EventTradeView outcomes={outcomes} initialMarketId={children[0].id} />
            <p className="mt-4 text-[11px]" style={{ color: "var(--text-2)" }}>
              As probabilidades são independentes por mercado e não somam 100%.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
