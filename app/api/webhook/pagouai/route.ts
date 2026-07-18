import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function pagouaiAuth() {
  const key = process.env.PAGOUAI_SECRET_KEY!
  return "Basic " + Buffer.from(`${key}:x`).toString("base64")
}

// Pagou.ai posts payment status updates here.
// SECURITY: never trust the webhook body — anyone can POST here. We only use
// the id as a hint, then re-fetch the transaction from Pagou.ai's API and
// credit based on what THEY say (status + amount).
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("[webhook/pagouai]", JSON.stringify(body))

    const id = body?.id ?? body?.data?.id
    if (!id) return NextResponse.json({ ok: true })

    // Find pending transaction by Pagou.ai reference
    const transaction = await prisma.transaction.findFirst({
      where: {
        reference: String(id),
        status: "PENDING",
        type: "DEPOSIT",
      },
    })

    if (!transaction) {
      console.warn("[webhook/pagouai] Transaction not found for id:", id)
      return NextResponse.json({ ok: true })
    }

    // Verify directly with Pagou.ai — the source of truth
    let remote: any
    try {
      const res = await fetch(`https://api.conta.pagou.ai/v1/transactions/${id}`, {
        headers: { Authorization: pagouaiAuth() },
        cache: "no-store",
      })
      if (!res.ok) {
        console.error("[webhook/pagouai] Verify failed:", res.status)
        return NextResponse.json({ error: "Verify failed" }, { status: 502 })
      }
      remote = await res.json()
    } catch (err) {
      console.error("[webhook/pagouai] Verify fetch error:", err)
      return NextResponse.json({ error: "Verify error" }, { status: 502 })
    }

    if (remote?.status !== "paid") {
      console.log(`[webhook/pagouai] Tx ${id} not paid yet (status: ${remote?.status})`)
      return NextResponse.json({ ok: true })
    }

    if (typeof remote?.amount === "number" && remote.amount !== transaction.amount) {
      console.error(`[webhook/pagouai] Amount mismatch for ${id}: local ${transaction.amount}, remote ${remote.amount}`)
      return NextResponse.json({ error: "Amount mismatch" }, { status: 409 })
    }

    // Credit user and mark transaction as completed atomically.
    // The status: PENDING guard makes this idempotent — a duplicate webhook
    // finds no pending row and credits nothing.
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: { id: transaction.id, status: "PENDING" },
        data: { status: "COMPLETED" },
      })
      if (updated.count === 0) return false
      await tx.user.update({
        where: { id: transaction.userId },
        data: { balance: { increment: transaction.amount } },
      })
      return true
    })

    if (result) {
      console.log(`[webhook/pagouai] Credited R$${transaction.amount / 100} to user ${transaction.userId}`)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[webhook/pagouai] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
