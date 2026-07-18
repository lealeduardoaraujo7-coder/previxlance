import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

// PUT /api/admin/destaques/ordem
// Body: { orderedIds: string[] }  — new carousel order, first = position 0
export async function PUT(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { orderedIds } = body

  if (!Array.isArray(orderedIds) || !orderedIds.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "'orderedIds' deve ser uma lista de IDs" }, { status: 400 })
  }

  // Reindex only markets that are actually featured; ignore unknown/removed ids.
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.market.updateMany({
        where: { id, featured: true },
        data: { featuredOrder: index },
      }),
    ),
  )

  return NextResponse.json({ ok: true })
}
