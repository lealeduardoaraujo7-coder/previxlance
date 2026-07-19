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

// Deposit via Boleto. Mirrors the PIX route (/api/depositar) exactly — same
// gateway (api.conta.pagou.ai/v1/transactions), same auth, same customer/items
// shape — only paymentMethod and the method-specific block/response differ.
//
// Crediting is handled by the SHARED webhook (/api/webhook/pagouai) and polled
// by /api/depositar/status. Both are method-agnostic (they match on the
// DEPOSIT transaction's `reference`), so no change is needed there: when the
// boleto is paid, the webhook verifies status "paid" with the gateway and
// credits the balance — identical to PIX.
//
// ⚠️ NEEDS ONE REAL TEST TO CONFIRM: the `boleto` request block and the boleto
// response fields (url / barcode / linha digitável) below are modeled on the
// working PIX contract, but the gateway's boleto docs are not public. After the
// first real (or sandbox) boleto, verify the field names against the actual
// response and adjust the marked spots if needed.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  // Payments are OFF unless the gateway key is configured (kept unset in the
  // public preview). No key → no boleto is ever generated.
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

  // Boleto expiration: 3 days from now (a boleto is not paid instantly like PIX).
  const expDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const expDateStr = expDate.toISOString().split("T")[0]

  const body = {
    amount,
    paymentMethod: "boleto",
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
    // ⚠️ VERIFY: boleto-specific block, modeled on the PIX `pix: { expirationDate }`.
    boleto: { expirationDate: expDateStr },
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
      console.error("[depositar/boleto] Pagou.ai error:", pagouaiData)
      return NextResponse.json(
        { error: pagouaiData.message ?? "Erro ao gerar boleto" },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error("[depositar/boleto] Pagou.ai fetch error:", err)
    return NextResponse.json({ error: "Erro de conexão com gateway" }, { status: 500 })
  }

  // Create PENDING transaction linked to Pagou.ai. Same shape as the PIX route
  // so the shared webhook/status route credit it with no special-casing.
  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "DEPOSIT",
      amount,
      status: "PENDING",
      reference: String(pagouaiData.id),
      notes: `Boleto Pagou.ai #${pagouaiData.id}`,
    },
  })

  // ⚠️ VERIFY: read the boleto payload defensively — the exact field names
  // depend on the gateway's real response. We try the most common shapes.
  const boleto = pagouaiData.boleto ?? {}
  const boletoUrl =
    boleto.url ?? boleto.pdf ?? boleto.pdfUrl ?? pagouaiData.url ?? null
  const boletoLine =
    boleto.line ??
    boleto.digitableLine ??
    boleto.formattedLine ??
    boleto.barcode ??
    pagouaiData.line ??
    null

  return NextResponse.json({
    ok: true,
    transactionId: pagouaiData.id,
    url: boletoUrl,
    line: boletoLine,
    expiresAt: expDateStr,
    amount,
  })
}
