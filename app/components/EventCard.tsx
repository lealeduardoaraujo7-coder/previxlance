import Link from "next/link"
import MarketImage from "@/app/components/MarketImage"
import { volLabel, OutcomeRow } from "@/app/components/cardParts"
import { oddsLabel, childYesPct, childHasPool, eventVolume, sortChildrenByPool } from "@/lib/events"

export default function EventCard({ event }: { event: any; index?: number }) {
  // Prefer OPEN children; fall back to all if none are open (edge case)
  const openChildren = event.markets.filter((m: any) => m.status === "OPEN")
  const children = openChildren.length > 0 ? openChildren : event.markets
  const sorted = sortChildrenByPool(children)
  const top2 = sorted.slice(0, 2)
  const total = children.length
  const moreCount = Math.max(0, total - 2)
  const vol = eventVolume(event.markets)

  const closeDate = new Date(event.closesAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
    + " às " + new Date(event.closesAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + "h"

  const seriesUnderline = ["var(--green)", "#2f6ff5"]
  const seriesBlock = ["rgba(0,192,118,0.18)", "rgba(47,111,245,0.18)"]

  return (
    <article className="market-card relative flex flex-col rounded-xl p-4 sm:p-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <Link href={`/evento/${event.slug}`} aria-label={event.title}
        className="absolute inset-0" style={{ zIndex: 0, borderRadius: 12 }} />

      {/* Header */}
      <div className="relative" style={{ zIndex: 1, pointerEvents: "none" }}>
        <div className="flex items-center gap-2.5">
          <MarketImage imageUrl={event.imageUrl} category={event.categoryRef} size={28} />
          <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--text-2)", letterSpacing: "0.08em" }}>
            {event.categoryRef?.name ?? event.category}
          </span>
          {event.collection && (
            <span className="ml-auto text-[12px] truncate" style={{ color: "var(--text-2)" }}>{event.collection}</span>
          )}
        </div>

        <h3 className="text-[16px] sm:text-[17px] mt-2.5" style={{
          color: "var(--text-0)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {event.title}
        </h3>

        <p className="text-[12px] mt-1.5" style={{ color: "var(--text-2)" }}>Fecha em {closeDate}</p>
      </div>

      {/* Top-2 children by pool */}
      <div className="relative mt-4 flex flex-col gap-2.5" style={{ zIndex: 1, pointerEvents: "none" }}>
        {top2.map((child: any, i: number) => {
          const pct = childYesPct(child.options, child.liquidity)
          return (
            <OutcomeRow key={child.id}
              href={`/mercados/${child.id}?lado=SIM`}
              blockColor={seriesBlock[i] ?? seriesBlock[1]}
              imageUrl={child.shortImageUrl}
              name={child.shortLabel || child.title}
              underline={seriesUnderline[i] ?? seriesUnderline[1]}
              pct={pct}
              odds={oddsLabel(pct, childHasPool(child.options))} />
          )
        })}
      </div>

      {/* Footer: volume · mais N · N mercados */}
      <div className="relative mt-4 flex items-center justify-between text-[12px] tabular-nums"
        style={{ zIndex: 1, pointerEvents: "none", color: "var(--text-2)" }}>
        <span>{volLabel(vol)} vol</span>
        <span>
          {moreCount > 0 && (
            <Link href={`/evento/${event.slug}`} className="hover:underline" style={{ pointerEvents: "auto", color: "var(--text-2)" }}>
              mais {moreCount}
            </Link>
          )}
          {moreCount > 0 && " · "}
          {total} mercados
        </span>
      </div>
    </article>
  )
}
