import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { makeEventSlug } from "@/lib/events"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

// GET /api/admin/eventos — list events with child counts
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      categoryRef: true,
      markets: { select: { totalPool: true, status: true } },
      _count: { select: { markets: true } },
    },
  })
  return NextResponse.json(events)
}

// POST /api/admin/eventos — create (slug from title)
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { title, description, imageUrl, category, collection, closesAt } = body

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return NextResponse.json({ error: "Título obrigatório (mín. 3 caracteres)" }, { status: 400 })
  }
  if (!closesAt) return NextResponse.json({ error: "Data de fechamento obrigatória" }, { status: 400 })

  const slug = await makeEventSlug(title)
  const event = await prisma.event.create({
    data: {
      slug,
      title: title.trim(),
      description: description || null,
      imageUrl: imageUrl || null,
      category: category || "outros",
      collection: collection || null,
      closesAt: new Date(closesAt),
    },
  })
  return NextResponse.json(event)
}
