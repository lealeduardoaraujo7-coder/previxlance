import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comments = await prisma.comment.findMany({
    where: { marketId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { likes: true } },
    },
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const { text, gifUrl } = await req.json()
  if (!text?.trim() && !gifUrl) return NextResponse.json({ error: "Comentário vazio" }, { status: 400 })
  if (text?.length > 500) return NextResponse.json({ error: "Máximo 500 caracteres" }, { status: 400 })

  const comment = await prisma.comment.create({
    data: { userId: session.user.id, marketId: id, text: text?.trim() ?? "", gifUrl: gifUrl || null },
    include: { user: { select: { id: true, name: true, image: true } }, _count: { select: { likes: true } } },
  })
  return NextResponse.json(comment)
}
