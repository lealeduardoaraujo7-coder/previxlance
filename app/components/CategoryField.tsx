"use client"
import { useEffect, useState } from "react"

type Cat = { slug: string; name: string }
export const NEW_CATEGORY = "__new__"

/**
 * Category picker for market/event forms. Renders a select of DB categories
 * plus a "+ Criar nova categoria…" option that reveals a name field.
 *
 * Submit flow: the parent calls `resolveCategory(value, newName)` before
 * posting — it returns the final slug (creating/reusing the category by slug).
 */
export function CategoryField({
  value, onChange, newName, onNewName, inputClass,
}: {
  value: string
  onChange: (slug: string) => void
  newName: string
  onNewName: (name: string) => void
  inputClass: string
}) {
  const [categories, setCategories] = useState<Cat[]>([])
  const [notice, setNotice] = useState("")

  useEffect(() => {
    fetch("/api/categorias").then((r) => r.json()).then((c) => { if (Array.isArray(c)) setCategories(c) }).catch(() => {})
  }, [])

  return (
    <div>
      <select value={value} onChange={(e) => { onChange(e.target.value); setNotice("") }} className={inputClass}>
        {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        <option value={NEW_CATEGORY}>+ Criar nova categoria…</option>
      </select>

      {value === NEW_CATEGORY && (
        <div className="mt-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => onNewName(e.target.value)}
            placeholder="Nome da categoria (ex: Esports)"
            className={inputClass}
          />
          <p className="mt-1 text-[11px]" style={{ color: "var(--text-2)" }}>
            Você pode definir a imagem depois em Categorias.
          </p>
          {notice && <p className="mt-1 text-[11px]" style={{ color: "var(--green)" }}>{notice}</p>}
        </div>
      )}
    </div>
  )
}

/**
 * Resolve the chosen category to a final slug. If "+ Criar nova" was selected,
 * creates or reuses the category by slug (dedup) and returns a notice when an
 * existing one was reused. Throws a user-facing message on invalid input.
 */
export async function resolveCategory(value: string, newName: string): Promise<{ slug: string; notice?: string }> {
  if (value !== NEW_CATEGORY) return { slug: value }
  if (newName.trim().length < 2) throw new Error("O nome da categoria precisa de ao menos 2 caracteres")
  const res = await fetch("/api/admin/categorias/resolver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Erro ao criar categoria")
  return { slug: data.slug, notice: data.reused ? `A categoria "${data.name}" já existe — usando ela.` : undefined }
}
