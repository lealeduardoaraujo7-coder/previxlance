import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveOrCreateCategory } from "@/lib/categories"

// POST /api/admin/categorias/resolver — { name } → find-or-create by slug.
// Used by the "+ Criar nova categoria" option in the market/event forms.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) }

  const result = await resolveOrCreateCategory(body?.name ?? "")
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })

  return NextResponse.json({
    slug: result.category.slug,
    name: result.category.name,
    reused: result.reused,
  })
}
