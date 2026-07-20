import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const COOLDOWN_DAYS = 30
const FREE_CHANGES = 2

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { username } = await req.json()
  const clean = String(username ?? "").trim().toLowerCase()

  if (!/^[a-z0-9_]{3,20}$/.test(clean))
    return NextResponse.json({ error: "Use 3–20 caracteres: letras, números ou _" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  if (clean === user.username)
    return NextResponse.json({ error: "Esse já é o seu nome de usuário" }, { status: 400 })

  const taken = await prisma.user.findUnique({ where: { username: clean } })
  if (taken) return NextResponse.json({ error: "Esse nome de usuário já está em uso" }, { status: 409 })

  if (user.usernameChanges >= FREE_CHANGES && user.usernameChangedAt) {
    const dias = (Date.now() - user.usernameChangedAt.getTime()) / 86_400_000
    if (dias < COOLDOWN_DAYS)
      return NextResponse.json(
        { error: `Você atingiu o limite de trocas. Aguarde ${Math.ceil(COOLDOWN_DAYS - dias)} dias.` },
        { status: 429 },
      )
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { username: clean, usernameChanges: { increment: 1 }, usernameChangedAt: new Date() },
  })

  return NextResponse.json({
    username: updated.username,
    trocasRestantes: Math.max(0, FREE_CHANGES - updated.usernameChanges),
    aviso: updated.usernameChanges >= FREE_CHANGES ? "Próximas trocas exigem intervalo de 30 dias." : null,
  })
}
