import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"
import { randomUUID } from "crypto"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não suportado. Use JPG, PNG, WebP ou GIF." }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5MB." }, { status: 400 })
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  try {
    // Persistent object storage (works on Vercel serverless, unlike disk writes).
    const { url } = await put(`uploads/${randomUUID()}.${ext}`, file, {
      access: "public",
      contentType: file.type,
    })
    return NextResponse.json({ url })
  } catch (err) {
    console.error("[upload] Vercel Blob error:", err)
    return NextResponse.json(
      { error: "Armazenamento de imagens não configurado (Vercel Blob). Verifique BLOB_READ_WRITE_TOKEN." },
      { status: 500 },
    )
  }
}
