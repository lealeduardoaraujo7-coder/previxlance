import { prisma } from "@/lib/prisma"

export type LeaderRow = {
  rank: number
  userId: string | null
  name: string
  image: string | null
  volume: number // cents — total wagered
  pnl: number    // cents — profit/loss on resolved markets
  placeholder: boolean
}

/**
 * Leaderboard ranked by volume (total wagered). Users with no activity are
 * excluded; empty positions are filled with "A definir" placeholders up to
 * `limit`, so the board is never blank while the platform is new.
 */
export async function getLeaderboard(limit = 10): Promise<LeaderRow[]> {
  const [volAgg, pnlAgg] = await Promise.all([
    prisma.bet.groupBy({ by: ["userId"], _sum: { amount: true } }),
    prisma.bet.groupBy({
      by: ["userId"],
      where: { market: { status: "RESOLVED" } },
      _sum: { amount: true, payout: true },
    }),
  ])

  const pnlMap = new Map(
    pnlAgg.map((r) => [r.userId, (r._sum.payout ?? 0) - (r._sum.amount ?? 0)]),
  )

  const active = volAgg
    .map((r) => ({ userId: r.userId, volume: r._sum.amount ?? 0, pnl: pnlMap.get(r.userId) ?? 0 }))
    .filter((r) => r.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)

  const users = active.length
    ? await prisma.user.findMany({
        where: { id: { in: active.map((a) => a.userId) } },
        select: { id: true, name: true, image: true },
      })
    : []
  const uMap = new Map(users.map((u) => [u.id, u]))

  const rows: LeaderRow[] = active.map((a, i) => {
    const u = uMap.get(a.userId)
    return {
      rank: i + 1,
      userId: a.userId,
      name: u?.name?.trim() || "Anônimo",
      image: u?.image ?? null,
      volume: a.volume,
      pnl: a.pnl,
      placeholder: false,
    }
  })

  // Reserve the remaining spots
  for (let i = rows.length; i < limit; i++) {
    rows.push({ rank: i + 1, userId: null, name: "A definir", image: null, volume: 0, pnl: 0, placeholder: true })
  }

  return rows
}
