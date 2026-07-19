import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import MarketImage from "@/app/components/MarketImage"
import { volLabel } from "@/app/components/cardParts"
import { sortChildrenByPool } from "@/lib/events"
import { priceCents } from "@/lib/amm"
import MarketChart from "./MarketChart"
import MarketTabs from "./MarketTabs"
import TradePanel, { type Outcome } from "./TradePanel"
import SaveButton from "./SaveButton"
import CommentSection from "./CommentSection"

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60_000) return "agora"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m atrás`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h atrás`
  return `${Math.floor(diff / 86_400_000)}d atrás`
}

function timeLeft(d: Date | string) {
  const diff = new Date(d).getTime() - Date.now()
  if (diff <= 0) return "encerrado"
  const days = Math.floor(diff / 86_400_000)
  if (days > 0) return `${days}d`
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs > 0) return `${hrs}h`
  return `${Math.floor(diff / 60_000)}m`
}

export default async function MercadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      options: true,
      categoryRef: true,
      _count: { select: { bets: true } },
      event: { include: { categoryRef: true, markets: { include: { options: true } } } },
      bets: {
        take: 10, orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, option: { select: { label: true } } },
      },
    },
  })
  if (!market) notFound()

  const savedMarket = session
    ? await prisma.savedMarket.findUnique({ where: { userId_marketId: { userId: session.user.id, marketId: id } } })
    : null

  const isOpen = market.status === "OPEN"
  const binary = market.options.length === 2
  const catName = market.categoryRef?.name ?? market.category

  // Sibling outcomes (event children) or just this market.
  const siblings = market.event ? sortChildrenByPool(market.event.markets) : []
  const relevantIds = market.event ? siblings.map((m) => m.id) : [market.id]

  const positions = session
    ? await prisma.position.findMany({ where: { userId: session.user.id, marketId: { in: relevantIds } } })
    : []
  const posMap: Record<string, Record<string, number>> = {}
  for (const p of positions) (posMap[p.marketId] ??= {})[p.optionId] = p.shares

  const outcomes: Outcome[] = market.event
    ? siblings.map((m) => ({
        marketId: m.id,
        name: m.shortLabel || m.title,
        imageUrl: m.shortImageUrl || m.imageUrl,
        liquidity: m.liquidity,
        options: m.options.map((o) => ({ id: o.id, label: o.label, shares: o.shares })),
        positions: posMap[m.id] ?? {},
      }))
    : [{
        marketId: market.id,
        name: market.title,
        imageUrl: market.imageUrl,
        liquidity: market.liquidity,
        options: market.options.map((o) => ({ id: o.id, label: o.label, shares: o.shares })),
        positions: posMap[market.id] ?? {},
      }]
  const showList = !!market.event && siblings.length > 1

  // Chart: SIM (or leading) probability of THIS market.
  const chartHasPool = market.options.some((o) => o.shares > 0)
  const chartIdx = Math.max(0, market.options.findIndex((o) => o.label === "SIM"))
  const yesPct = chartHasPool ? priceCents(market.options.map((o) => o.shares), market.liquidity, chartIdx) : 50
  const chartLabel = market.options[chartIdx]?.label === "SIM" ? "Sim" : market.options[chartIdx]?.label ?? "Sim"
  const seriesColor = market.event ? (market.event.categoryRef?.color ?? market.categoryRef?.color ?? undefined) : undefined
  const bandColor = seriesColor

  const closesAtStr = new Date(market.closesAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  const rules = [
    { label: "Fecha em", value: closesAtStr },
    { label: "Categoria", value: catName },
    { label: "Tipo", value: binary ? "Binário (SIM / NÃO)" : "Múltiplas opções" },
    { label: "Taxa", value: "2% por operação" },
    { label: "Resolução", value: "Resultado oficial · contrato vencedor paga R$1" },
  ]
  const activity = market.bets.map((b) => ({
    id: b.id, side: b.side, amount: b.amount,
    label: b.option?.label ?? "—",
    name: b.user?.name?.split(" ")[0] ?? "Trader",
    ago: timeAgo(b.createdAt),
  }))

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Color band for event children (matches the event page) */}
      {bandColor && (
        <div style={{ background: `linear-gradient(180deg, ${bandColor}22 0%, transparent 100%)` }}>
          <div style={{ height: 3, background: bandColor }} />
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-6">
        {market.event ? (
          <Link href={`/evento/${market.event.slug}`} className="text-sm" style={{ color: "var(--text-2)" }}>← {market.event.title}</Link>
        ) : (
          <Link href="/" className="text-sm" style={{ color: "var(--text-2)" }}>← Mercados</Link>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start mt-4">
          {/* ── LEFT ── */}
          <div className="space-y-5 min-w-0">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <MarketImage imageUrl={market.imageUrl} category={market.categoryRef} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--text-2)", letterSpacing: "0.08em" }}>{catName}</span>
                  {market.event?.collection && <span className="text-[12px]" style={{ color: "var(--text-2)" }}>· {market.event.collection}</span>}
                </div>
                <h1 className="text-[26px] font-semibold mt-1" style={{ color: "var(--text-0)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{market.title}</h1>
                {/* Single meta line */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]" style={{ color: "var(--text-2)" }}>
                  <span className="tabular-nums">{volLabel(market.totalPool)} <span>vol</span></span>
                  <span>·</span>
                  <span>{isOpen ? `fecha em ${timeLeft(market.closesAt)}` : market.status === "RESOLVED" ? "resolvido" : "fechado"}</span>
                </div>
              </div>
              <SaveButton marketId={market.id} initialSaved={!!savedMarket} />
            </div>

            {/* Single probability chart */}
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <MarketChart marketId={market.id} yesPct={yesPct} seriesColor={seriesColor} seriesLabel={chartLabel} />
            </div>

            {/* About */}
            {market.description && (
              <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-2)" }}>Sobre este mercado</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-1)" }}>{market.description}</p>
              </div>
            )}

            {/* Rules / Activity tabs */}
            <MarketTabs rules={rules} activity={activity} />

            {/* Resolved banner */}
            {market.status === "RESOLVED" && market.resolution && (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--green-dim)", border: "1px solid rgba(0,192,118,0.28)" }}>
                <span className="text-lg">✓</span>
                <p className="text-sm font-semibold" style={{ color: "var(--text-0)" }}>Resolvido: {market.resolution}</p>
              </div>
            )}

            <CommentSection marketId={market.id} />
          </div>

          {/* ── RIGHT (sticky) ── */}
          <div className="lg:sticky lg:top-6">
            {isOpen ? (
              <TradePanel outcomes={outcomes} initialMarketId={market.id} showList={showList} />
            ) : (
              <div className="rounded-2xl p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text-0)" }}>
                  {market.status === "RESOLVED" ? "Mercado resolvido" : "Mercado fechado"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>Não é possível negociar neste mercado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
