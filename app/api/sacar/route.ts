import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { amount, pixKey } = await req.json()

  if (!amount || amount < 2000) {
    return NextResponse.json({ error: "Valor mínimo: R$ 20,00" }, { status: 400 })
  }

  if (!pixKey) {
    return NextResponse.json({ error: "Chave PIX obrigatória" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.balance < amount) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })
  }

  const fee = Math.round(amount * 0.01)

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "WITHDRAWAL",
        amount,
        status: "PENDING",
        pixKey,
        notes: `Taxa de 1%: ${fee} centavos`,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: amount } },
    }),
  ])

  const updatedUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { balance: true },
  })

  return NextResponse.json({ ok: true, balance: updatedUser?.balance ?? 0 })
}
