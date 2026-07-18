import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { title, description, imageUrl, category, type, closesAt, options, featured, eventId, shortLabel, shortImageUrl } = await req.json()

  if (!title || !closesAt) {
    return NextResponse.json({ error: "Título e data de fechamento são obrigatórios" }, { status: 400 })
  }

  // A market inside an event needs a short label for the event card line
  if (eventId && (typeof shortLabel !== "string" || !shortLabel.trim())) {
    return NextResponse.json({ error: "Rótulo curto é obrigatório para mercado dentro de um evento" }, { status: 400 })
  }

  if (type === "MULTIPLE") {
    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "Múltipla escolha requer ao menos 2 opções" }, { status: 400 })
    }
  }

  const optionsToCreate = type === "BINARY"
    ? [{ label: "SIM" }, { label: "NÃO" }]
    : (options as string[]).map((label) => ({ label: label.trim() }))

  // New markets are OPEN by default, so they may be featured immediately.
  // Append to the end of the carousel queue.
  let featuredOrder = 0
  if (featured) {
    const last = await prisma.market.findFirst({
      where: { featured: true },
      orderBy: { featuredOrder: "desc" },
      select: { featuredOrder: true },
    })
    featuredOrder = (last?.featuredOrder ?? 0) + 1
  }

  const market = await prisma.market.create({
    data: {
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      category,
      type,
      closesAt: new Date(closesAt),
      featured: Boolean(featured),
      featuredOrder,
      eventId: eventId || null,
      shortLabel: eventId ? shortLabel.trim() : null,
      shortImageUrl: eventId ? (shortImageUrl || null) : null,
      options: { create: optionsToCreate },
    },
  })

  return NextResponse.json(market)
}
