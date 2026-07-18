import { prisma } from "@/lib/prisma"

export const CAROUSEL_SETTING_ID = "carousel"
export const FALLBACK_VALUES = ["VOLUME", "LIVE", "RECENT", "NONE"] as const
export type Fallback = (typeof FALLBACK_VALUES)[number]

export type CarouselConfig = {
  id: string
  maxSlides: number
  autoplay: boolean
  intervalMs: number
  pauseOnHover: boolean
  fallback: Fallback
  updatedAt: Date
}

/** Read the carousel config singleton, creating it with defaults on first access. */
export async function getCarouselConfig(): Promise<CarouselConfig> {
  const existing = await prisma.setting.findUnique({ where: { id: CAROUSEL_SETTING_ID } })
  if (existing) return existing as CarouselConfig
  const created = await prisma.setting.create({ data: { id: CAROUSEL_SETTING_ID } })
  return created as CarouselConfig
}

/**
 * Demote markets that should no longer be featured: expired (featuredUntil in the
 * past) or no longer OPEN (resolved/closed/cancelled). Keeps the carousel clean at
 * read time without needing a separate cron. Returns how many were demoted.
 */
export async function deactivateStaleFeatured(now = new Date()): Promise<number> {
  const res = await prisma.market.updateMany({
    where: {
      featured: true,
      OR: [
        { status: { not: "OPEN" } },
        { AND: [{ featuredUntil: { not: null } }, { featuredUntil: { lt: now } }] },
      ],
    },
    data: { featured: false, featuredOrder: 0, featuredUntil: null },
  })
  return res.count
}

/** Count markets currently occupying a live carousel slot (after cleaning stale ones). */
export async function countActiveFeatured(now = new Date()): Promise<number> {
  await deactivateStaleFeatured(now)
  return prisma.market.count({ where: { featured: true } })
}

/** Featured markets in carousel order, stale ones already demoted. */
export async function getActiveFeaturedMarkets(now = new Date()) {
  await deactivateStaleFeatured(now)
  return prisma.market.findMany({
    where: { featured: true },
    orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
    include: { options: true, _count: { select: { bets: true } }, categoryRef: true },
  })
}

const carouselChildInclude = { options: true, _count: { select: { bets: true } }, categoryRef: true } as const

/**
 * Carousel items: featured events + featured STANDALONE markets, mixed and
 * ordered by volume desc. Dedup mirrors the grid — a market with an eventId is
 * never a slide on its own; it only appears inside its (featured) event's card.
 */
export async function getFeaturedItems(now = new Date()) {
  await deactivateStaleFeatured(now)
  const [markets, events] = await Promise.all([
    prisma.market.findMany({
      where: { featured: true, eventId: null },
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      include: carouselChildInclude,
    }),
    prisma.event.findMany({
      where: { featured: true, status: "OPEN" },
      include: { markets: { include: carouselChildInclude }, categoryRef: true },
    }),
  ])

  const items = [
    ...markets.map((m) => ({ kind: "market" as const, id: m.id, market: m, volume: m.totalPool })),
    ...events
      .filter((e) => e.markets.length >= 1)
      .map((e) => ({ kind: "event" as const, id: e.id, event: e, volume: e.markets.reduce((s, x) => s + (x.totalPool ?? 0), 0) })),
  ]

  return items.sort((a, b) => b.volume - a.volume)
}
