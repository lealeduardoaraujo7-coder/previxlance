import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

// GET /api/admin/eventos/:id — event with children
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: { markets: { orderBy: { totalPool: "desc" }, include: { _count: { select: { bets: true } } } } },
  })
  if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
  return NextResponse.json(event)
}

// PATCH /api/admin/eventos/:id — update fields (slug is not editable)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }

  if ("slug" in body) {
    return NextResponse.json({ error: "O slug é imutável — renomear é migração de dados." }, { status: 400 })
  }

  const { title, description, imageUrl, category, collection, closesAt, status, featured } = body
  const data: any = {}
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length < 3) return NextResponse.json({ error: "Título inválido" }, { status: 400 })
    data.title = title.trim()
  }
  if (description !== undefined) data.description = description || null
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null
  if (category !== undefined) data.category = category
  if (collection !== undefined) data.collection = collection || null
  if (closesAt !== undefined) data.closesAt = new Date(closesAt)
  if (status !== undefined) data.status = status
  if (featured !== undefined) data.featured = Boolean(featured)

  const event = await prisma.event.update({ where: { id }, data })
  return NextResponse.json(event)
}

// DELETE /api/admin/eventos/:id — children are unlinked (SetNull), not deleted.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
