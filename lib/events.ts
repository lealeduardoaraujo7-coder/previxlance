import { prisma } from "@/lib/prisma"
import { sortChildrenByPool } from "@/lib/eventHelpers"

// Re-export the pure helpers so existing server imports (`@/lib/events`) keep
// working. Client Components must import them from `@/lib/eventHelpers` directly
// to avoid pulling prisma into the client bundle.
export { childYesPct, optionPct, oddsLabel, childHasPool, eventVolume, sortChildrenByPool } from "@/lib/eventHelpers"

const childInclude = { options: true, _count: { select: { bets: true } }, categoryRef: true } as const

/** One event with its children (markets), children pre-sorted by pool desc. */
export async function getEventBySlug(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { markets: { include: childInclude }, categoryRef: true },
  })
  if (!event) return null
  return { ...event, markets: sortChildrenByPool(event.markets) }
}

/** Turn a title into a unique slug (kebab-case + numeric suffix on collision). */
export async function makeEventSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "evento"

  let slug = base
  let n = 1
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n++}`
  }
  return slug
}
