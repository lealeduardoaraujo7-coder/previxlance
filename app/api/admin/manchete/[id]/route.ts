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

// PATCH /api/admin/manchete/:id — update fields (label, text, color, enabled)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { label, text, color, enabled } = body

  const data: any = {}
  if (label !== undefined) {
    if (typeof label !== "string" || !label.trim()) return NextResponse.json({ error: "Rótulo inválido" }, { status: 400 })
    data.label = label.trim()
  }
  if (text !== undefined) {
    if (typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "Texto inválido" }, { status: 400 })
    data.text = text.trim()
  }
  if (color !== undefined) {
    if (!HEX.test(color)) return NextResponse.json({ error: "Cor deve ser hex #RRGGBB" }, { status: 400 })
    data.color = color
  }
  if (enabled !== undefined) {
    if (typeof enabled !== "boolean") return NextResponse.json({ error: "'enabled' deve ser booleano" }, { status: 400 })
    data.enabled = enabled
  }

  const item = await prisma.tickerItem.update({ where: { id }, data })
  return NextResponse.json(item)
}

// DELETE /api/admin/manchete/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  await prisma.tickerItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
