import { prisma } from "@/lib/prisma"

/**
 * Lazy auto-close: flips any market whose deadline has passed from OPEN → CLOSED
 * so it stops accepting bets and shows up in the admin resolution queue. Called
 * at the top of the main server pages and the trade route (belt-and-suspenders).
 *
 * We don't auto-RESOLVE — picking the winner is still a human decision (the
 * Kalshi model). This only halts trading at the deadline. Idempotent: a run with
 * nothing expired is a single cheap indexed UPDATE affecting 0 rows.
 *
 * Returns the number of markets closed (0 most of the time).
 */
export async function closeExpiredMarkets(): Promise<number> {
  const res = await prisma.market.updateMany({
    where: { status: "OPEN", closesAt: { lte: new Date() } },
    data: { status: "CLOSED" },
  })
  return res.count
}
