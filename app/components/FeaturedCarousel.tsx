"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import MarketImage from "@/app/components/MarketImage"
import { OutcomeRow, volLabel } from "@/app/components/cardParts"
import { childYesPct, childHasPool, oddsLabel, eventVolume, sortChildrenByPool } from "@/lib/eventHelpers"

type Item =
  | { kind: "market"; id: string; market: any; volume: number }
  | { kind: "event"; id: string; event: any; volume: number }

function closeLabel(d: string) {
  const date = new Date(d)
  if (date.getTime() - Date.now() <= 0) return "Encerrado"
  return "Fecha em " + date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
    + " às " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + "h"
}

const SERIES_UNDER = ["var(--green)", "#2f6ff5", "#f59e0b", "#a855f7"]
const SERIES_BLOCK = ["rgba(0,192,118,0.18)", "rgba(47,111,245,0.18)", "rgba(245,158,11,0.18)", "rgba(168,85,247,0.18)"]

function SlideHeader({ imageUrl, category, categoryName, title, sub, collection }: {
  imageUrl: string | null; category: any; categoryName: string; title: string; sub: string; collection?: string | null
}) {
  return (
    <div className="flex items-start gap-3">
      <MarketImage imageUrl={imageUrl} category={category} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--text-2)", letterSpacing: "0.08em" }}>{categoryName}</span>
          {collection && <span className="ml-auto text-[12px] truncate" style={{ color: "var(--text-2)" }}>{collection}</span>}
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold leading-snug mt-1" style={{ color: "var(--text-0)" }}>{title}</h2>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-2)" }}>{sub}</p>
      </div>
    </div>
  )
}

function MarketSlide({ market }: { market: any }) {
  const isBinary = market.type === "BINARY"
  const pool = market.options.reduce((s: number, o: any) => s + o.totalBet, 0)
  const hasPool = pool > 0
  const yes = market.options.find((o: any) => o.label === "SIM")
  const yesPct = hasPool ? Math.round(((yes?.totalBet ?? 0) / pool) * 100) : null
  const noPct = yesPct === null ? null : 100 - yesPct

  return (
    <div className="flex flex-col h-full">
      <SlideHeader imageUrl={market.imageUrl} category={market.categoryRef}
        categoryName={market.categoryRef?.name ?? market.category} title={market.title} sub={closeLabel(market.closesAt)} />

      <div className="mt-5 flex flex-col gap-2.5">
        {isBinary ? (
          <>
            <OutcomeRow href={`/mercados/${market.id}?lado=SIM`} blockColor={SERIES_BLOCK[0]} name="Sim" underline={SERIES_UNDER[0]} pct={yesPct} odds={oddsLabel(yesPct, hasPool)} />
            <OutcomeRow href={`/mercados/${market.id}?lado=NAO`} blockColor={SERIES_BLOCK[1]} name="Não" underline={SERIES_UNDER[1]} pct={noPct} odds={oddsLabel(noPct, hasPool)} />
          </>
        ) : (
          market.options.slice(0, 4).map((opt: any, i: number) => {
            const pct = hasPool ? Math.round((opt.totalBet / pool) * 100) : null
            return <OutcomeRow key={opt.id} href={`/mercados/${market.id}?lado=${encodeURIComponent(opt.label)}`}
              blockColor={SERIES_BLOCK[i % 4]} name={opt.label} underline={SERIES_UNDER[i % 4]} pct={pct} odds={oddsLabel(pct, hasPool)} />
          })
        )}
      </div>

      <div className="mt-auto pt-4 text-[12px] tabular-nums" style={{ color: "var(--text-2)" }}>
        {volLabel(market.totalPool)} vol
      </div>
    </div>
  )
}

function EventSlide({ event }: { event: any }) {
  const open = event.markets.filter((m: any) => m.status === "OPEN")
  const children = sortChildrenByPool(open.length > 0 ? open : event.markets)
  const shown = children.slice(0, 4)
  const more = Math.max(0, children.length - shown.length)

  return (
    <div className="flex flex-col h-full">
      <SlideHeader imageUrl={event.imageUrl} category={event.categoryRef}
        categoryName={event.categoryRef?.name ?? event.category} title={event.title} sub={closeLabel(event.closesAt)} collection={event.collection} />

      <div className="mt-5 flex flex-col gap-2.5">
        {shown.map((child: any, i: number) => {
          const pct = childYesPct(child.options)
          return <OutcomeRow key={child.id} href={`/mercados/${child.id}?lado=SIM`}
            blockColor={SERIES_BLOCK[i % 4]} imageUrl={child.shortImageUrl} name={child.shortLabel || child.title} underline={SERIES_UNDER[i % 4]}
            pct={pct} odds={oddsLabel(pct, childHasPool(child.options))} />
        })}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between text-[12px] tabular-nums" style={{ color: "var(--text-2)" }}>
        <span>{volLabel(eventVolume(event.markets))} vol</span>
        <span>
          {more > 0 && (
            <Link href={`/evento/${event.slug}`} className="hover:underline" style={{ pointerEvents: "auto", color: "var(--text-2)" }}>mais {more}</Link>
          )}
          {more > 0 && " · "}
          {children.length} mercados
        </span>
      </div>
    </div>
  )
}

export default function FeaturedCarousel({
  items, intervalMs = 8000, autoplay = true, pauseOnHover = true,
}: {
  items: Item[]; intervalMs?: number; autoplay?: boolean; pauseOnHover?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [hovering, setHovering] = useState(false)

  const count = items.length
  const multi = count > 1

  useEffect(() => { if (index >= count) setIndex(0) }, [count, index])

  const go = useCallback((dir: number) => {
    setStopped(true)
    setIndex((i) => (i + dir + count) % count)
  }, [count])

  useEffect(() => {
    if (!multi || !autoplay || stopped) return
    if (pauseOnHover && hovering) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs)
    return () => clearInterval(t)
  }, [multi, autoplay, stopped, hovering, pauseOnHover, intervalMs, count])

  if (count === 0) return null
  const current = items[Math.min(index, count - 1)]
  const href = current.kind === "event" ? `/evento/${current.event.slug}` : `/mercados/${current.market.id}`

  return (
    <div className="relative rounded-2xl mb-8 p-6 sm:p-7" style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      {/* Whole-slide link below; pills opt back in via pointer-events */}
      <Link href={href} aria-label="Ver destaque" className="absolute inset-0" style={{ zIndex: 0, borderRadius: 16 }} />

      <div className="relative" style={{ zIndex: 1, pointerEvents: "none" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--green)" }}>★ Destaque</span>
          {multi && (
            <div className="flex items-center gap-2" style={{ pointerEvents: "auto" }}>
              <button onClick={() => go(-1)} aria-label="Anterior" className="h-8 w-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--card-2)]" style={{ border: "1px solid var(--border-2)", color: "var(--text-1)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="text-[12px] tabular-nums min-w-[52px] text-center" style={{ color: "var(--text-2)" }}>{index + 1} de {count}</span>
              <button onClick={() => go(1)} aria-label="Próximo" className="h-8 w-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--card-2)]" style={{ border: "1px solid var(--border-2)", color: "var(--text-1)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          )}
        </div>

        <div style={{ minHeight: 260 }}>
          {current.kind === "event"
            ? <EventSlide key={current.id} event={current.event} />
            : <MarketSlide key={current.id} market={current.market} />}
        </div>
      </div>
    </div>
  )
}
