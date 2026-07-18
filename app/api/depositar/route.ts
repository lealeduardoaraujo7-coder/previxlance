import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function pagouaiAuth() {
  const key = process.env.PAGOUAI_SECRET_KEY!
  return "Basic " + Buffer.from(`${key}:x`).toString("base64")
}

function cleanCPF(cpf: string) {
  return cpf.replace(/\D/g, "")
}

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "")
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  // Payments are OFF unless the gateway key is configured (kept unset in the
  // public preview). No key → no PIX charge is ever generated.
  if (!process.env.PAGOUAI_SECRET_KEY) {
    return NextResponse.json({ error: "Depósitos estão temporariamente indisponíveis." }, { status: 503 })
  }

  const { amount, cpf, phone } = await req.json()

  if (!amount || amount < 500) {
    return NextResponse.json({ error: "Valor mínimo: R$ 5,00" }, { status: 400 })
  }
  if (amount > 50000000) {
    return NextResponse.json({ error: "Valor máximo: R$ 500.000,00" }, { status: 400 })
  }

  const cpfClean = cleanCPF(cpf ?? "")
  if (cpfClean.length !== 11) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 })
  }

  const phoneClean = cleanPhone(phone ?? "")
  if (phoneClean.length < 10) {
    return NextResponse.json({ error: "Telefone inválido" }, { status: 400 })
  }

  // Save CPF/phone to user if not set yet
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      cpf: cpfClean,
      phone: phoneClean,
    },
  })

  // Expiration: 30 minutes from now
  const expDate = new Date(Date.now() + 30 * 60 * 1000)
  const expDateStr = expDate.toISOString().split("T")[0]

  const body = {
    amount,
    paymentMethod: "pix",
    customer: {
      name: session.user.name || "Usuário PrevixLance",
      email: session.user.email!,
      document: { number: cpfClean, type: "cpf" },
      phone: phoneClean,
    },
    items: [
      {
        title: "Depósito PrevixLance",
        unitPrice: amount,
        quantity: 1,
        tangible: false,
      },
    ],
    pix: { expirationDate: expDateStr },
    postbackUrl: process.env.PAGOUAI_WEBHOOK_URL ?? undefined,
    metadata: { userId: session.user.id },
  }

  let pagouaiData: any
  try {
    const res = await fetch("https://api.conta.pagou.ai/v1/transactions", {
      method: "POST",
      headers: {
        "Authorization": pagouaiAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    pagouaiData = await res.json()
    if (!res.ok) {
      console.error("[depositar] Pagou.ai error:", pagouaiData)
      return NextResponse.json(
        { error: pagouaiData.message ?? "Erro ao gerar PIX" },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error("[depositar] Pagou.ai fetch error:", err)
    return NextResponse.json({ error: "Erro de conexão com gateway" }, { status: 500 })
  }

  // Create PENDING transaction linked to Pagou.ai
  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "DEPOSIT",
      amount,
      status: "PENDING",
      reference: String(pagouaiData.id),
      notes: `PIX Pagou.ai #${pagouaiData.id}`,
    },
  })

  return NextResponse.json({
    ok: true,
    transactionId: pagouaiData.id,
    qrcode: pagouaiData.pix?.qrcode,
    expiresAt: pagouaiData.pix?.expirationDate,
    amount,
  })
}
