import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

// PUT /api/admin/categorias/ordem — { orderedIds: string[] }
export async function PUT(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { orderedIds } = body

  if (!Array.isArray(orderedIds) || !orderedIds.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "'orderedIds' deve ser uma lista de IDs" }, { status: 400 })
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.updateMany({ where: { id }, data: { order: index } }),
    ),
  )
  return NextResponse.json({ ok: true })
}
