import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX = 3 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const fd = await req.formData()
  const file = fd.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo" }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  if (file.size > MAX) return NextResponse.json({ error: "Máximo 3MB" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const filename = `${randomUUID()}.${ext}`
  const dir = path.join(process.cwd(), "public", "uploads", "avatars")
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

  const url = `/uploads/avatars/${filename}`
  await prisma.user.update({ where: { id: session.user.id }, data: { image: url } })
  return NextResponse.json({ url })
}
