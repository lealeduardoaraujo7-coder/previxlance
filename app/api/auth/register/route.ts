import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { verifyCode, EVC_COOKIE } from "@/lib/emailCode"

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export async function POST(req: Request) {
  const { name, email, password, username, code } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 })
  }

  // If a verification cookie is present, the e-mail code must match. When there's
  // no cookie (Resend not configured), signup proceeds without a code.
  const jar = await cookies()
  const evc = jar.get(EVC_COOKIE)?.value
  if (evc) {
    if (!code) return NextResponse.json({ error: "Informe o código enviado ao seu e-mail" }, { status: 400 })
    if (!verifyCode(evc, email, String(code))) {
      return NextResponse.json({ error: "Código incorreto ou expirado" }, { status: 400 })
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 })
  }

  // Optional username chosen at signup. If invalid or taken we tell the user so
  // they can adjust; when omitted, a provisional @user_xxxx is assigned on login.
  let handle: string | null = null
  if (typeof username === "string" && username.trim()) {
    handle = username.trim().toLowerCase()
    if (!USERNAME_RE.test(handle)) {
      return NextResponse.json({ error: "Usuário: 3–20 caracteres, apenas letras, números e _" }, { status: 400 })
    }
    const taken = await prisma.user.findUnique({ where: { username: handle } })
    if (taken) {
      return NextResponse.json({ error: "Esse nome de usuário já está em uso" }, { status: 400 })
    }
  }

  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: { name, email, password: hashed, ...(handle ? { username: handle } : {}) },
  })

  const res = NextResponse.json({ ok: true })
  if (evc) res.cookies.set(EVC_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
  return res
}
