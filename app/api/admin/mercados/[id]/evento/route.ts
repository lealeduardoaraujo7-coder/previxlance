import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

// PATCH /api/admin/mercados/:id/evento — link/unlink/relabel event membership.
// Body: { eventId: string | null, shortLabel?: string }
//  - eventId=null → unlink (market becomes standalone; shortLabel cleared)
//  - eventId set  → link; shortLabel is required and non-empty
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { eventId, shortLabel, shortImageUrl } = body

  const market = await prisma.market.findUnique({ where: { id } })
  if (!market) return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })

  // Unlink
  if (eventId == null) {
    const updated = await prisma.market.update({ where: { id }, data: { eventId: null, shortLabel: null, shortImageUrl: null } })
    return NextResponse.json({ ok: true, market: updated })
  }

  // Link — event must exist and shortLabel is required
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } })
  if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
  if (typeof shortLabel !== "string" || !shortLabel.trim()) {
    return NextResponse.json({ error: "Rótulo curto é obrigatório para vincular a um evento" }, { status: 400 })
  }

  const data: any = { eventId, shortLabel: shortLabel.trim() }
  if (shortImageUrl !== undefined) data.shortImageUrl = shortImageUrl || null

  const updated = await prisma.market.update({ where: { id }, data })
  return NextResponse.json({ ok: true, market: updated })
}
