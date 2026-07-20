import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { randomUUID } from "crypto"

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const fd = await req.formData()
  const file = fd.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo" }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Tipo inválido. Use JPG, PNG, WebP ou GIF." }, { status: 400 })
  if (file.size > MAX) return NextResponse.json({ error: "Arquivo muito grande. Máximo 5MB." }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  let url: string
  try {
    const blob = await put(`uploads/avatars/${randomUUID()}.${ext}`, file, {
      access: "public",
      contentType: file.type,
    })
    url = blob.url
  } catch (err) {
    console.error("[perfil/foto] Vercel Blob error:", err)
    return NextResponse.json(
      { error: "Armazenamento de imagens não configurado (Vercel Blob)." },
      { status: 500 },
    )
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { image: url } })
  return NextResponse.json({ url })
}
