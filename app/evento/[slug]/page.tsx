import Link from "next/link"
import { notFound } from "next/navigation"
import MarketImage from "@/app/components/MarketImage"
import { volLabel } from "@/app/components/cardParts"
import { OutcomeThumb } from "@/app/components/OutcomeThumb"

const SERIES_BLOCK = ["rgba(0,192,118,0.18)", "rgba(47,111,245,0.18)", "rgba(245,158,11,0.18)", "rgba(168,85,247,0.18)"]
import { getEventBySlug, childYesPct, childHasPool, oddsLabel, eventVolume } from "@/lib/events"

/** Normalize for comparison: lowercase, strip accents, collapse whitespace. */
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, " ").trim()
}
/** The secondary title only adds value when it isn't just the short label again. */
function titleAddsInfo(shortLabel: string | null, title: string) {
  if (!shortLabel) return true // no short label → the title IS the label
  return norm(shortLabel) !== norm(title)
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) notFound()

  const children = event.markets // already sorted by pool desc
  const openCount = children.filter((m) => m.status === "OPEN").length
  const vol = eventVolume(children)

  const closeDate = new Date(event.closesAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  }) + " às " + new Date(event.closesAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + "h"

  // Color band pulled from the event's category tint (the single color source).
  const bandColor = event.categoryRef?.color ?? "#8b98a5"

  return (
    <div>
      {/* Top color band — the event's tint as a thin accent + soft gradient. */}
      <div className="relative" style={{ background: `linear-gradient(180deg, ${bandColor}22 0%, transparent 100%)` }}>
        <div style={{ height: 3, background: bandColor }} />
        <div className="mx-auto max-w-3xl px-4 pt-5 pb-2">
          <Link href="/" className="text-sm" style={{ color: "var(--text-2)" }}>← Voltar</Link>

          {/* Header */}
          <div className="mt-4 flex items-start gap-3.5">
            <MarketImage imageUrl={event.imageUrl} category={event.categoryRef} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--text-2)", letterSpacing: "0.08em" }}>
                  {event.categoryRef?.name ?? event.category}
                </span>
                {event.collection && (
                  <span className="text-[12px]" style={{ color: "var(--text-2)" }}>· {event.collection}</span>
                )}
              </div>
              <h1 className="text-[26px] font-semibold mt-1" style={{ color: "var(--text-0)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {event.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-8">

      {/* Meta line */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]" style={{ color: "var(--text-2)" }}>
        <span>Fecha em <span style={{ color: "var(--text-1)" }}>{closeDate}</span></span>
        <span className="tabular-nums">{volLabel(vol)} <span style={{ color: "var(--text-2)" }}>volume</span></span>
        <span className="tabular-nums">{openCount} {openCount === 1 ? "mercado" : "mercados"}</span>
      </div>

      {/* Description */}
      {event.description && (
        <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--text-1)" }}>{event.description}</p>
      )}

      {/* Children list */}
      <div className="mt-7">
        {children.length === 0 ? (
          <div className="rounded-xl p-10 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Nenhum mercado neste evento ainda.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {children.map((child, i) => {
              const pct = childYesPct(child.options, child.liquidity)
              const hasPool = childHasPool(child.options)
              return (
                <Link key={child.id} href={`/mercados/${child.id}?lado=SIM`}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 transition-colors hover:bg-[var(--card-2)]"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                  {/* Per-line thumb (image or series block) — shared OutcomeThumb */}
                  <OutcomeThumb imageUrl={child.shortImageUrl} blockColor={SERIES_BLOCK[i % 4]} />
                  {/* Label + full title. Hide the secondary title when it only
                      repeats the short label (e.g. "ESPANHA / ESPANHA"). */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold truncate" style={{ color: "var(--text-0)" }}>
                      {child.shortLabel || child.title}
                    </p>
                    {titleAddsInfo(child.shortLabel, child.title) && child.shortLabel && (
                      <p className="text-[12px] truncate" style={{ color: "var(--text-2)" }}>{child.title}</p>
                    )}
                  </div>
                  {/* Individual pool */}
                  <span className="hidden sm:block text-[12px] tabular-nums text-right" style={{ color: "var(--text-2)", width: 96 }}>
                    {volLabel(child.totalPool)} vol
                  </span>
                  {/* Odds */}
                  <span className="text-[13px] tabular-nums text-right" style={{ color: "var(--text-2)", width: 56 }}>
                    {oddsLabel(pct, hasPool)}
                  </span>
                  {/* Prob pill — no pool → muted "—" */}
                  <span className={`prob-pill flex-shrink-0${pct === null ? " prob-pill-muted" : ""}`} style={{ minWidth: 64 }}>
                    {pct === null ? "—" : `${pct}%`}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

        <p className="mt-4 text-[11px]" style={{ color: "var(--text-2)" }}>
          As probabilidades são independentes por mercado e não somam 100%.
        </p>
      </div>
    </div>
  )
}
