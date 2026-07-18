import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCarouselConfig, countActiveFeatured } from "@/lib/featured"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

// PATCH /api/admin/mercados/:id/destaque
// Body: { featured: boolean, featuredOrder?: number, featuredUntil?: string | null }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { featured, featuredOrder, featuredUntil } = body

  if (typeof featured !== "boolean") {
    return NextResponse.json({ error: "Campo 'featured' deve ser booleano" }, { status: 400 })
  }

  const market = await prisma.market.findUnique({ where: { id } })
  if (!market) return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })

  // --- Remove from featured ---
  if (!featured) {
    const updated = await prisma.market.update({
      where: { id },
      data: { featured: false, featuredOrder: 0, featuredUntil: null },
    })
    return NextResponse.json({ ok: true, market: updated })
  }

  // --- Add to featured: validate status, limit and date ---
  if (market.status !== "OPEN") {
    return NextResponse.json({ error: "Só mercados abertos podem ser destacados" }, { status: 400 })
  }

  let untilDate: Date | null = null
  if (featuredUntil != null) {
    untilDate = new Date(featuredUntil)
    if (isNaN(untilDate.getTime())) {
      return NextResponse.json({ error: "Data 'featuredUntil' inválida" }, { status: 400 })
    }
    if (untilDate.getTime() <= Date.now()) {
      return NextResponse.json({ error: "A data de destaque deve ser no futuro" }, { status: 400 })
    }
  }

  const config = await getCarouselConfig()
  const activeCount = await countActiveFeatured() // also cleans stale ones

  // Only enforce the limit when this market is NOT already featured (re-saving an
  // already-featured market to tweak its order/date must not be blocked).
  if (!market.featured && activeCount >= config.maxSlides) {
    return NextResponse.json(
      { error: `Limite de ${config.maxSlides} destaques atingido — remova um antes de adicionar.` },
      { status: 409 },
    )
  }

  // Default order: append to the end of the queue.
  let order = featuredOrder
  if (typeof order !== "number" || !Number.isFinite(order)) {
    const last = await prisma.market.findFirst({
      where: { featured: true },
      orderBy: { featuredOrder: "desc" },
      select: { featuredOrder: true },
    })
    order = (last?.featuredOrder ?? 0) + 1
  }

  const updated = await prisma.market.update({
    where: { id },
    data: { featured: true, featuredOrder: order, featuredUntil: untilDate },
  })
  return NextResponse.json({ ok: true, market: updated })
}
