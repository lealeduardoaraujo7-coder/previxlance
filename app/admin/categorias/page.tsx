import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CategoriesEditor from "./CategoriesEditor"

export default async function CategoriasPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { markets: true, events: true } } },
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-sm" style={{ color: "var(--text-2)" }}>← Voltar ao painel</Link>
        <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--text-0)" }}>Categorias</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Imagem, cor, nome e ordem. O slug é fixo — não é editável.
        </p>
      </div>

      <CategoriesEditor initial={categories as any} />
    </div>
  )
}
