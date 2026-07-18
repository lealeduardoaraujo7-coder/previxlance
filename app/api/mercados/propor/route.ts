import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const body = await req.json()
    console.log("[propor] body recebido:", JSON.stringify(body))

    const { title, description, imageUrl, category, type, closesAt, options } = body

    if (!title || !closesAt) {
      return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 })
    }

    // datetime-local input gives "2027-01-01T00:00" — ensure valid ISO
    const closeDate = new Date(closesAt.length === 16 ? closesAt + ":00" : closesAt)
    if (isNaN(closeDate.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 })
    }
    console.log("[propor] closeDate:", closeDate)

    const marketType = type === "MULTIPLE" ? "MULTIPLE" : "BINARY"
    const optionsToCreate = marketType === "BINARY"
      ? [{ label: "SIM" }, { label: "NÃO" }]
      : (options as string[]).filter(Boolean).slice(0, 8).map((label: string) => ({ label: label.trim() }))

    console.log("[propor] criando market com status PENDING, type:", marketType)

    const market = await prisma.market.create({
      data: {
        title: title.trim(),
        description: description || null,
        imageUrl: imageUrl || null,
        category: category || "outros",
        type: marketType,
        status: "PENDING",
        closesAt: closeDate,
        proposedByName: session.user.name || null,
        proposedByEmail: session.user.email || null,
        options: { create: optionsToCreate },
      },
    })

    console.log("[propor] market criado:", market.id)
    return NextResponse.json(market, { status: 201 })
  } catch (err: any) {
    console.error("[propor] ERRO DETALHADO:", err?.message, err?.code, err?.stack)
    return NextResponse.json({ error: "Erro interno: " + (err?.message ?? "desconhecido") }, { status: 500 })
  }
}
