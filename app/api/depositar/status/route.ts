import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ref = searchParams.get("ref")
  if (!ref) return NextResponse.json({ error: "ref obrigatório" }, { status: 400 })

  const transaction = await prisma.transaction.findFirst({
    where: {
      userId: session.user.id,
      reference: ref,
      type: "DEPOSIT",
    },
    select: { status: true },
  })

  if (!transaction) return NextResponse.json({ status: "NOT_FOUND" })
  return NextResponse.json({ status: transaction.status })
}
