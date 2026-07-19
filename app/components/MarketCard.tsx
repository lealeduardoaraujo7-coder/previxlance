import Link from "next/link"
import MarketImage from "@/app/components/MarketImage"
import { volLabel, OutcomeRow } from "@/app/components/cardParts"
import { oddsLabel, childYesPct, childHasPool, optionPct } from "@/lib/events"

export default function MarketCard({ market }: { market: any; index?: number }) {
  const isBinary = market.type === "BINARY"
  // Prices come from the LMSR engine (shares + liquidity). Untraded → null ("—").
  const hasPool = childHasPool(market.options)
  const yesPct = childYesPct(market.options, market.liquidity)
  const noPct  = yesPct === null ? null : 100 - yesPct
  const isOpen = market.status === "OPEN"

  const closeDate = new Date(market.closesAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long",
  }) + " às " + new Date(market.closesAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + "h"

  return (
    <article
      className="market-card relative flex flex-col rounded-xl p-4 sm:p-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Whole-card link sits below; content passes clicks through, pills opt back in */}
      <Link href={`/mercados/${market.id}`} aria-label={market.title}
        className="absolute inset-0" style={{ zIndex: 0, borderRadius: 12 }} />

      <div className="relative" style={{ zIndex: 1, pointerEvents: "none" }}>
        {/* Header: image + category + collection */}
        <div className="flex items-center gap-2.5">
          <MarketImage imageUrl={market.imageUrl} category={market.categoryRef} size={28} />
          <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--text-2)", letterSpacing: "0.08em" }}>
            {market.categoryRef?.name ?? market.category}
          </span>
          {/* collection name (none in our data) → intentionally empty */}
          <span className="ml-auto text-[12px]" style={{ color: "var(--text-2)" }} />
        </div>

        {/* Title */}
        <h3 className="text-[16px] sm:text-[17px] mt-2.5" style={{
          color: "var(--text-0)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {market.title}
        </h3>

        {/* Date */}
        <p className="text-[12px] mt-1.5" style={{ color: "var(--text-2)" }}>{closeDate}</p>
      </div>

      {/* Result rows */}
      <div className="relative mt-4 flex flex-col gap-2.5" style={{ zIndex: 1, pointerEvents: "none" }}>
        {isBinary && isOpen && (
          <>
            <OutcomeRow href={`/mercados/${market.id}?lado=SIM`} blockColor="rgba(0,192,118,0.18)"
              name="Sim" underline="var(--green)" pct={yesPct} odds={oddsLabel(yesPct, hasPool)} />
            <OutcomeRow href={`/mercados/${market.id}?lado=NAO`} blockColor="rgba(255,77,77,0.16)"
              name="Não" underline="#2f6ff5" pct={noPct} odds={oddsLabel(noPct, hasPool)} />
          </>
        )}

        {!isBinary && isOpen && market.options.slice(0, 4).map((opt: any, i: number) => {
          const pct = optionPct(market.options, market.liquidity, opt.label)
          return (
            <OutcomeRow key={opt.id} href={`/mercados/${market.id}?lado=${encodeURIComponent(opt.label)}`}
              blockColor="var(--card-2)" name={opt.label} underline={i === 0 ? "var(--green)" : "#2f6ff5"}
              pct={pct} odds={oddsLabel(pct, hasPool)} />
          )
        })}

        {market.status === "RESOLVED" && (
          <p className="text-[13px] font-semibold" style={{ color: "var(--green)" }}>
            ✓ Resolvido{market.resolution ? `: ${market.resolution}` : ""}
          </p>
        )}
        {!isOpen && market.status !== "RESOLVED" && (
          <p className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>Mercado fechado</p>
        )}
      </div>

      {/* Footer — standalone market: right side stays empty (no "1 mercado") */}
      <div className="relative mt-4 flex items-center justify-between text-[12px] tabular-nums"
        style={{ zIndex: 1, pointerEvents: "none", color: "var(--text-2)" }}>
        <span>{volLabel(market.totalPool)} vol</span>
        <span>{!isBinary && market.options.length > 4 ? `mais ${market.options.length - 4} opções` : ""}</span>
      </div>
    </article>
  )
}
