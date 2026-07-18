import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAllTickerItems } from "@/lib/ticker"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

const HEX = /^#[0-9a-fA-F]{6}$/

// GET /api/admin/manchete — all items (enabled or not)
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  return NextResponse.json(await getAllTickerItems())
}

// POST /api/admin/manchete — create a new item
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { label, text, color, enabled } = body

  if (typeof label !== "string" || !label.trim()) return NextResponse.json({ error: "Rótulo obrigatório" }, { status: 400 })
  if (typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "Texto obrigatório" }, { status: 400 })
  if (color != null && !HEX.test(color)) return NextResponse.json({ error: "Cor deve ser hex #RRGGBB" }, { status: 400 })

  const last = await prisma.tickerItem.findFirst({ orderBy: { order: "desc" }, select: { order: true } })
  const item = await prisma.tickerItem.create({
    data: {
      label: label.trim(),
      text: text.trim(),
      color: color ?? "#00c076",
      enabled: typeof enabled === "boolean" ? enabled : true,
      order: (last?.order ?? -1) + 1,
    },
  })
  return NextResponse.json(item)
}
