import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/mercados/livres?q= — standalone markets (no event) for linking.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? ""
  const markets = await prisma.market.findMany({
    where: { eventId: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
    take: 100,
  })
  const filtered = q ? markets.filter((m) => m.title.toLowerCase().includes(q)) : markets
  return NextResponse.json(filtered.slice(0, 20))
}
