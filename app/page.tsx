import Link from "next/link"
import { prisma } from "@/lib/prisma"
import FeaturedCarousel from "@/app/components/FeaturedCarousel"
import LiveTicker from "@/app/components/LiveTicker"
import MarketCard from "@/app/components/MarketCard"
import EventCard from "@/app/components/EventCard"
import DiscordCard from "@/app/components/DiscordCard"
import ProposeCard from "@/app/components/ProposeCard"
import { getFeaturedItems, getCarouselConfig } from "@/lib/featured"
import { eventVolume } from "@/lib/events"
import { getNavCategories } from "@/lib/categories"

const STATUS_TABS = [
  { value: "OPEN",     label: "Ao vivo"    },
  { value: "RESOLVED", label: "Resolvidos" },
]

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; status?: string; q?: string; sort?: string }>
}) {
  const { categoria, status, q, sort } = await searchParams
  const activeCategory = categoria ?? "TODOS"
  const activeStatus   = status   ?? "OPEN"
  const searchQuery    = q?.trim() ?? ""
  const sortNew        = sort === "novo"

  const childInclude = { options: true, _count: { select: { bets: true } }, categoryRef: true } as const
  const [standaloneMarkets, allEvents, featuredItems, carouselConfig] = await Promise.all([
    // DEDUP: only markets without an event render as their own card. A market
    // that belongs to an event appears ONLY inside that event's card.
    prisma.market.findMany({
      where: { eventId: null },
      orderBy: { createdAt: "desc" },
      include: childInclude,
    }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { markets: { include: childInclude }, categoryRef: true },
    }),
    getFeaturedItems(),
    getCarouselConfig(),
  ])

  // Filter chips read the SAME curated set as the nav bar (showInNav)
  const navCategories = await getNavCategories()
  const CATEGORIES = [
    { value: "TODOS", label: "Todos" },
    ...navCategories.map((c) => ({ value: c.slug, label: c.name })),
  ]

  type GridItem = {
    kind: "market" | "event"
    id: string
    market?: any
    event?: any
    volume: number
    createdAt: Date
    category: string
    status: string
    title: string
  }

  const rawItems: GridItem[] = [
    ...standaloneMarkets.map((m): GridItem => ({
      kind: "market", id: m.id, market: m, volume: m.totalPool,
      createdAt: m.createdAt, category: m.category, status: m.status, title: m.title,
    })),
    // Events with no children have nothing to show — skip them in the grid
    ...allEvents.filter((e) => e.markets.length >= 1).map((e): GridItem => ({
      kind: "event", id: e.id, event: e, volume: eventVolume(e.markets),
      createdAt: e.createdAt, category: e.category, status: e.status, title: e.title,
    })),
  ]

  const items = rawItems
    .filter((it) => {
      if (!sortNew && it.status !== activeStatus) return false
      if (!sortNew && activeCategory !== "TODOS" && it.category !== activeCategory) return false
      if (searchQuery && !it.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    // Mixed grid ordered by volume desc; "Novo" tab keeps newest-first
    .sort((a, b) => (sortNew ? b.createdAt.getTime() - a.createdAt.getTime() : b.volume - a.volume))

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <LiveTicker />

      {/* ── Main content — grid renders immediately, no marketing landing ──── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="min-w-0">

        {!searchQuery && activeStatus === "OPEN" && featuredItems.length > 0 && (
          <FeaturedCarousel
            items={featuredItems as any}
            intervalMs={carouselConfig.intervalMs}
            autoplay={carouselConfig.autoplay}
            pauseOnHover={carouselConfig.pauseOnHover}
          />
        )}

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          {searchQuery ? (
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold" style={{ color: "var(--text-0)" }}>
                Resultados para <span style={{ color: "var(--green)" }}>"{searchQuery}"</span>
              </h1>
              <Link href="/" className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: "var(--card-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                Limpar
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {activeStatus === "OPEN" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ backgroundColor: "var(--green)" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--green)" }} />
                </span>
              )}
              <h2 className="text-lg font-bold" style={{ color: "var(--text-0)" }}>
                {activeStatus === "OPEN" ? "Mercados ao vivo" : "Mercados resolvidos"}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold" style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.2)" }}>
                {items.length}
              </span>
            </div>
          )}
        </div>

        {/* Tabs + filters */}
        {!searchQuery && (
          <>
            <div className="flex gap-2 mb-4">
              {STATUS_TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={`/?status=${tab.value}&categoria=${activeCategory}`}
                  className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
                  style={activeStatus === tab.value ? {
                    background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.25)",
                  } : {
                    background: "var(--card)", color: "var(--text-1)", border: "1px solid var(--border)",
                  }}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 mb-7 flex-wrap">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.value}
                  href={`/?status=${activeStatus}&categoria=${cat.value}`}
                  className="rounded-full px-3.5 py-1 text-[11px] font-semibold transition-all"
                  style={activeCategory === cat.value ? {
                    background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.25)",
                  } : {
                    background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)",
                  }}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Grid */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-5 h-16 w-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>🔮</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-0)" }}>
              {searchQuery ? "Nenhum mercado encontrado" : "Nenhum mercado aqui"}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-1)" }}>
              {searchQuery ? "Tente outros termos de busca." : "Tente outra categoria ou aguarde novos mercados."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2" style={{ alignItems: "start" }}>
            {items.map((it, i) =>
              it.kind === "event"
                // An event with a single child is just a market — render it as one
                ? (it.event.markets.length === 1
                    ? <MarketCard key={it.id} market={it.event.markets[0]} index={i} />
                    : <EventCard key={it.id} event={it.event} index={i} />)
                : <MarketCard key={it.id} market={it.market} index={i} />
            )}
          </div>
        )}
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-24 space-y-4">
            <DiscordCard />
            <ProposeCard />
          </aside>
        </div>
      </div>
    </div>
  )
}

