import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: true, _count: { select: { bets: true } } },
  })
  if (!market) return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })
  return NextResponse.json(market)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  const { title, description, imageUrl, category, closesAt, featured, eventId, shortLabel, shortImageUrl } = await req.json()
  if (!title || !closesAt) return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 })

  const current = await prisma.market.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })

  const data: any = { title, description: description || null, imageUrl: imageUrl || null, category, closesAt: new Date(closesAt) }

  // Event membership (optional). shortLabel required whenever an event is set.
  if (eventId !== undefined) {
    if (eventId) {
      if (typeof shortLabel !== "string" || !shortLabel.trim()) {
        return NextResponse.json({ error: "Rótulo curto é obrigatório para mercado dentro de um evento" }, { status: 400 })
      }
      data.eventId = eventId
      data.shortLabel = shortLabel.trim()
      data.shortImageUrl = shortImageUrl || null
    } else {
      data.eventId = null
      data.shortLabel = null
      data.shortImageUrl = null
    }
  }

  // Handle featured toggle from the edit form (only when the field is present).
  if (typeof featured === "boolean") {
    if (featured) {
      if (current.status !== "OPEN") {
        return NextResponse.json({ error: "Só mercados abertos podem ser destacados" }, { status: 400 })
      }
      data.featured = true
      if (!current.featured) {
        const last = await prisma.market.findFirst({
          where: { featured: true },
          orderBy: { featuredOrder: "desc" },
          select: { featuredOrder: true },
        })
        data.featuredOrder = (last?.featuredOrder ?? 0) + 1
      }
    } else {
      data.featured = false
      data.featuredOrder = 0
      data.featuredUntil = null
    }
  }

  const market = await prisma.market.update({ where: { id }, data })
  return NextResponse.json(market)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const { action, resolution } = body

  const market = await prisma.market.findUnique({
    where: { id },
    include: { options: true, bets: true },
  })
  if (!market) return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })

  // --- approve pending ---
  if (action === "approve") {
    if (market.status !== "PENDING") return NextResponse.json({ error: "Mercado não está pendente" }, { status: 400 })
    await prisma.market.update({ where: { id }, data: { status: "OPEN" } })
    return NextResponse.json({ ok: true })
  }

  // --- reject pending ---
  if (action === "reject") {
    if (market.status !== "PENDING") return NextResponse.json({ error: "Mercado não está pendente" }, { status: 400 })
    await prisma.market.update({ where: { id }, data: { status: "CANCELLED" } })
    return NextResponse.json({ ok: true })
  }

  // --- close ---
  if (action === "close") {
    if (market.status !== "OPEN") return NextResponse.json({ error: "Mercado não está aberto" }, { status: 400 })
    await prisma.market.update({ where: { id }, data: { status: "CLOSED" } })
    return NextResponse.json({ ok: true })
  }

  // --- reopen ---
  if (action === "reopen") {
    if (market.status !== "CLOSED") return NextResponse.json({ error: "Mercado não está fechado" }, { status: 400 })
    await prisma.market.update({ where: { id }, data: { status: "OPEN" } })
    return NextResponse.json({ ok: true })
  }

  // --- cancel (refund all bets) ---
  if (action === "cancel") {
    if (market.status === "CANCELLED") return NextResponse.json({ error: "Mercado já cancelado" }, { status: 400 })
    if (market.status === "RESOLVED") return NextResponse.json({ error: "Não é possível cancelar um mercado já resolvido" }, { status: 400 })
    await prisma.$transaction(async (tx) => {
      await tx.market.update({ where: { id }, data: { status: "CANCELLED" } })
      for (const bet of market.bets) {
        await tx.user.update({ where: { id: bet.userId }, data: { balance: { increment: bet.amount } } })
      }
    })
    return NextResponse.json({ ok: true })
  }

  // --- resolve ---
  if (resolution) {
    if (market.status !== "OPEN" && market.status !== "CLOSED") {
      return NextResponse.json({ error: "Mercado não pode ser resolvido" }, { status: 400 })
    }
    const winningOption = market.options.find((o) => o.label === resolution)
    if (!winningOption) return NextResponse.json({ error: "Opção inválida" }, { status: 400 })
    const winningBets = market.bets.filter((b) => b.optionId === winningOption.id)
    const fee = Math.floor(market.totalPool * 0.02)
    const prizePool = market.totalPool - fee
    const winningTotal = winningOption.totalBet
    await prisma.$transaction(async (tx) => {
      await tx.market.update({ where: { id }, data: { status: "RESOLVED", resolution, resolvedAt: new Date() } })
      for (const bet of winningBets) {
        const payout = winningTotal > 0 ? Math.floor((bet.amount / winningTotal) * prizePool) : 0
        await tx.bet.update({ where: { id: bet.id }, data: { payout } })
        await tx.user.update({ where: { id: bet.userId }, data: { balance: { increment: payout } } })
      }
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  const market = await prisma.market.findUnique({
    where: { id },
    include: { _count: { select: { bets: true } } },
  })
  if (!market) return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })

  if (market._count.bets > 0 && market.status !== "CANCELLED" && market.status !== "RESOLVED") {
    return NextResponse.json({ error: "Cancele o mercado antes de excluir para reembolsar as apostas." }, { status: 400 })
  }

  await prisma.market.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
