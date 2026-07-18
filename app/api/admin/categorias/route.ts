import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/categories"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

const HEX = /^#[0-9a-fA-F]{6}$/

// GET /api/admin/categorias — categories with market/event counts
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const cats = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { markets: true, events: true } } },
  })
  return NextResponse.json(cats)
}

// POST /api/admin/categorias — create (slug derived from name)
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { name, imageUrl, color, showInNav } = body

  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "O nome precisa de ao menos 2 caracteres" }, { status: 400 })
  }
  if (color != null && color !== "" && !HEX.test(color)) {
    return NextResponse.json({ error: "Cor deve ser hex #RRGGBB" }, { status: 400 })
  }
  const slug = slugify(name)
  if (!slug) return NextResponse.json({ error: "Nome inválido" }, { status: 400 })

  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: `A categoria "${existing.name}" já existe.`, category: existing }, { status: 409 })
  }

  const last = await prisma.category.findFirst({ orderBy: { order: "desc" }, select: { order: true } })
  const category = await prisma.category.create({
    data: {
      slug,
      name: name.trim(),
      imageUrl: imageUrl || null,
      color: color || null,
      showInNav: Boolean(showInNav),
      order: (last?.order ?? -1) + 1,
    },
  })
  return NextResponse.json(category)
}
