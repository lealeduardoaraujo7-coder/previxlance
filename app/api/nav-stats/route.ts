import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { priceCents } from "@/lib/amm"

/** Lightweight stats for the navbar: live-market count (public) + the signed-in
 * user's portfolio value (sum of open positions at current LMSR price). */
export async function GET() {
  const session = await getServerSession(authOptions)
  const live = await prisma.market.count({ where: { status: "OPEN" } })

  let portfolio = 0
  if (session) {
    const positions = await prisma.position.findMany({
      where: { userId: session.user.id, shares: { gt: 0.0001 } },
      include: { market: { include: { options: true } } },
    })
    for (const p of positions) {
      const idx = p.market.options.findIndex((o) => o.id === p.optionId)
      if (idx < 0) continue
      const price = priceCents(p.market.options.map((o) => o.shares), p.market.liquidity, idx)
      portfolio += Math.round(p.shares * price)
    }
  }

  return NextResponse.json({ live, portfolio })
}
