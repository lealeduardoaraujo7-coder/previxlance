import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

const HEX = /^#[0-9a-fA-F]{6}$/

// PATCH /api/admin/categorias/:id — update name/imageUrl/color/showInNav.
// The slug is IMMUTABLE: any `slug` in the payload is rejected, not ignored.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }

  if ("slug" in body) {
    return NextResponse.json(
      { error: "O slug é imutável — renomear é migração de dados, não edição." },
      { status: 400 },
    )
  }

  const { name, imageUrl, color, showInNav } = body
  const data: any = {}
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "O nome precisa de ao menos 2 caracteres" }, { status: 400 })
    }
    data.name = name.trim()
  }
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null
  if (color !== undefined) {
    if (color && !HEX.test(color)) return NextResponse.json({ error: "Cor deve ser hex #RRGGBB" }, { status: 400 })
    data.color = color || null
  }
  if (showInNav !== undefined) {
    if (typeof showInNav !== "boolean") return NextResponse.json({ error: "'showInNav' deve ser booleano" }, { status: 400 })
    data.showInNav = showInNav
  }

  const category = await prisma.category.update({ where: { id }, data })
  return NextResponse.json(category)
}

// DELETE /api/admin/categorias/:id — blocked while any market/event uses it.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { markets: true, events: true } } },
  })
  if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })

  const inUse = category._count.markets + category._count.events
  if (inUse > 0) {
    const parts = [
      category._count.markets ? `${category._count.markets} mercado(s)` : "",
      category._count.events ? `${category._count.events} evento(s)` : "",
    ].filter(Boolean).join(" e ")
    return NextResponse.json(
      { error: `Mova os ${parts} desta categoria antes de excluir.` },
      { status: 409 },
    )
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
