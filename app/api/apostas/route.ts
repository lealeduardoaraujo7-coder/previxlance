import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { marketId, optionId, amount } = await req.json()

  if (!marketId || !optionId || !amount || amount < 100) {
    return NextResponse.json({ error: "Valor mínimo: R$ 1,00" }, { status: 400 })
  }

  const [market, user] = await Promise.all([
    prisma.market.findUnique({ where: { id: marketId }, include: { options: true } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])

  if (!market || market.status !== "OPEN") {
    return NextResponse.json({ error: "Mercado não disponível" }, { status: 400 })
  }

  const option = market.options.find((o) => o.id === optionId)
  if (!option) return NextResponse.json({ error: "Opção inválida" }, { status: 400 })

  if (!user || user.balance < amount) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.bet.create({
      data: { userId: session.user.id, marketId, optionId, amount },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: amount } },
    }),
    prisma.market.update({
      where: { id: marketId },
      data: { totalPool: { increment: amount } },
    }),
    prisma.marketOption.update({
      where: { id: optionId },
      data: { totalBet: { increment: amount } },
    }),
  ])

  const updatedUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { balance: true },
  })

  return NextResponse.json({ ok: true, balance: updatedUser?.balance ?? 0 })
}
