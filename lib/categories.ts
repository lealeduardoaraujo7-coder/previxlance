import { prisma } from "@/lib/prisma"

export type CategoryDTO = {
  id: string
  slug: string
  name: string
  imageUrl: string | null
  color: string | null
  showInNav: boolean
  order: number
}

/** All categories, ordered for admin/forms. */
export function getCategories() {
  return prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] })
}

/** Categories curated into the top navigation bar. */
export function getNavCategories() {
  return prisma.category.findMany({ where: { showInNav: true }, orderBy: { order: "asc" } })
}

/** Normalize a free-text name into a slug: lowercase, no accents, spaces → "-". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * Find a category by the slug derived from `rawName`, or create it (showInNav
 * false, no image). Dedups by slug so "Esports", "esports" and "ESPORTS" never
 * become three categories. Used by the "+ Criar nova categoria" form flow.
 */
export async function resolveOrCreateCategory(rawName: string) {
  const name = (rawName ?? "").trim()
  if (name.length < 2) return { error: "O nome precisa de ao menos 2 caracteres" as const }
  const slug = slugify(name)
  if (!slug) return { error: "Nome inválido" as const }

  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) return { category: existing, reused: true }

  const last = await prisma.category.findFirst({ orderBy: { order: "desc" }, select: { order: true } })
  const category = await prisma.category.create({
    data: { slug, name, showInNav: false, order: (last?.order ?? -1) + 1 },
  })
  return { category, reused: false }
}
