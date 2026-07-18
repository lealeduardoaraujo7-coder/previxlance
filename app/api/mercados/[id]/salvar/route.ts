import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.savedMarket.findUnique({
    where: { userId_marketId: { userId: session.user.id, marketId: id } },
  })

  if (existing) {
    await prisma.savedMarket.delete({ where: { id: existing.id } })
    return NextResponse.json({ saved: false })
  } else {
    await prisma.savedMarket.create({ data: { userId: session.user.id, marketId: id } })
    return NextResponse.json({ saved: true })
  }
}
