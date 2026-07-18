import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const markets = await prisma.market.findMany({
    where: { status: "OPEN" },
    orderBy: [{ totalPool: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: {
      id: true, title: true, category: true, totalPool: true, imageUrl: true,
      options: { select: { label: true, totalBet: true }, orderBy: { totalBet: "desc" }, take: 1 },
      _count: { select: { bets: true } },
    },
  })
  return NextResponse.json(markets)
}
