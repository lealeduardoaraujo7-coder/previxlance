import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { transactionId, action } = await req.json()

  if (!transactionId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!tx || tx.status !== "PENDING" || tx.type !== "WITHDRAWAL") {
    return NextResponse.json({ error: "Transação não encontrada ou já processada" }, { status: 400 })
  }

  if (action === "approve") {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED" },
    })
  } else {
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "REJECTED" },
      }),
      prisma.user.update({
        where: { id: tx.userId },
        data: { balance: { increment: tx.amount } },
      }),
    ])
  }

  return NextResponse.json({ ok: true })
}
