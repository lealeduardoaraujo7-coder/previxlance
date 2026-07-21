import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signCode, EVC_COOKIE } from "@/lib/emailCode"

/**
 * Sends a 6-digit verification code to the e-mail via Resend and stores it in a
 * signed httpOnly cookie. If RESEND_API_KEY isn't set, returns { configured:false }
 * so the client can fall back to direct signup (no verification) — nothing breaks
 * before the key is added on Vercel.
 */
export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 })
  }

  // Don't send a code to an address that already has an account.
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Este e-mail já tem conta. Conecte-se." }, { status: 400 })

  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ configured: false })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const from = process.env.RESEND_FROM || "PrevixLance <onboarding@resend.dev>"

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject: `${code} é o seu código PrevixLance`,
      html: `
        <div style="font-family:system-ui,Arial,sans-serif;max-width:440px;margin:0 auto;padding:24px">
          <h2 style="color:#0f5138;margin:0 0 8px">PrevixLance</h2>
          <p style="color:#333;font-size:15px">Use o código abaixo para confirmar seu cadastro:</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#0f5138;background:#eafaf1;border-radius:12px;text-align:center;padding:18px;margin:16px 0">${code}</div>
          <p style="color:#888;font-size:12px">O código expira em 10 minutos. Se você não pediu isso, ignore este e-mail.</p>
        </div>`,
    }),
  })

  if (!r.ok) {
    return NextResponse.json({ error: "Não foi possível enviar o e-mail. Tente novamente." }, { status: 502 })
  }

  const res = NextResponse.json({ ok: true, configured: true })
  res.cookies.set(EVC_COOKIE, signCode(email, code), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600,
  })
  return res
}
