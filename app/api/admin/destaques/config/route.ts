import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCarouselConfig, CAROUSEL_SETTING_ID, FALLBACK_VALUES } from "@/lib/featured"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

// GET /api/admin/destaques/config
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const config = await getCarouselConfig()
  return NextResponse.json(config)
}

// PUT /api/admin/destaques/config
// Body: { maxSlides, autoplay, intervalMs, pauseOnHover, fallback }
export async function PUT(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }
  const { maxSlides, autoplay, intervalMs, pauseOnHover, fallback } = body

  if (!Number.isInteger(maxSlides) || maxSlides < 1 || maxSlides > 10) {
    return NextResponse.json({ error: "maxSlides deve ser um inteiro entre 1 e 10" }, { status: 400 })
  }
  if (!Number.isInteger(intervalMs) || intervalMs < 3000 || intervalMs > 30000) {
    return NextResponse.json({ error: "intervalMs deve estar entre 3000 e 30000 (3–30s)" }, { status: 400 })
  }
  if (typeof autoplay !== "boolean" || typeof pauseOnHover !== "boolean") {
    return NextResponse.json({ error: "autoplay e pauseOnHover devem ser booleanos" }, { status: 400 })
  }
  if (!FALLBACK_VALUES.includes(fallback)) {
    return NextResponse.json({ error: `fallback deve ser um de: ${FALLBACK_VALUES.join(", ")}` }, { status: 400 })
  }

  const data = { maxSlides, autoplay, intervalMs, pauseOnHover, fallback }
  const config = await prisma.setting.upsert({
    where: { id: CAROUSEL_SETTING_ID },
    update: data,
    create: { id: CAROUSEL_SETTING_ID, ...data },
  })

  return NextResponse.json({ ok: true, config })
}
