"use client"
import { useState } from "react"
import ImageUpload from "@/app/components/ImageUpload"

type Cat = {
  id: string
  slug: string
  name: string
  imageUrl: string | null
  color: string | null
  showInNav: boolean
  order: number
  _count: { markets: number; events: number }
}

const PRESETS = ["#dbeafe", "#dcfce7", "#fef3c7", "#f3e8ff", "#e0f2fe", "#fee2e2", "#fce7f3", "#f3f4f6"]

export default function CategoriesEditor({ initial }: { initial: Cat[] }) {
  const [cats, setCats] = useState<Cat[]>(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [dragId, setDragId] = useState<string | null>(null)

  // New category form
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#f3f4f6")
  const [newNav, setNewNav] = useState(false)

  function patchLocal(id: string, patch: Partial<Cat>) {
    setCats((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function saveRow(id: string) {
    const c = cats.find((x) => x.id === id)
    if (!c) return
    setSaving(id); setError("")
    const res = await fetch(`/api/admin/categorias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: c.name, imageUrl: c.imageUrl, color: c.color, showInNav: c.showInNav }),
    })
    setSaving(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Erro ao salvar") }
  }

  async function toggleNav(id: string, showInNav: boolean) {
    patchLocal(id, { showInNav })
    const res = await fetch(`/api/admin/categorias/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ showInNav }),
    })
    if (!res.ok) patchLocal(id, { showInNav: !showInNav })
  }

  async function removeRow(c: Cat) {
    const inUse = c._count.markets + c._count.events
    if (inUse > 0) { setError(`"${c.name}": mova os ${c._count.markets} mercado(s) desta categoria antes de excluir.`); return }
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return
    const prev = cats
    setCats((list) => list.filter((x) => x.id !== c.id))
    const res = await fetch(`/api/admin/categorias/${c.id}`, { method: "DELETE" })
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Erro"); setCats(prev) }
  }

  async function addCategory() {
    if (newName.trim().length < 2) { setError("O nome precisa de ao menos 2 caracteres"); return }
    setSaving("new"); setError("")
    const res = await fetch("/api/admin/categorias", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, color: newColor, showInNav: newNav }),
    })
    setSaving(null)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error || "Erro ao criar"); return }
    setCats((list) => [...list, { ...data, _count: { markets: 0, events: 0 } }])
    setNewName(""); setNewColor("#f3f4f6"); setNewNav(false)
  }

  // Drag reorder (native)
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const from = cats.findIndex((c) => c.id === dragId)
    const to = cats.findIndex((c) => c.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...cats]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setCats(next)
    setDragId(null)
    fetch("/api/admin/categorias/ordem", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((c) => c.id) }),
    }).catch(() => {})
  }

  const inputStyle = { background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" } as const

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>{error}</p>
      )}

      <div className="space-y-3">
        {cats.map((c) => (
          <div key={c.id}
            draggable
            onDragStart={() => setDragId(c.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(c.id)}
            className="rounded-xl p-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)", opacity: dragId === c.id ? 0.5 : 1 }}>
            <div className="flex items-start gap-3">
              {/* Drag handle */}
              <span className="cursor-grab select-none pt-2 text-lg leading-none" style={{ color: "var(--text-2)" }} title="Arraste para reordenar">⋮⋮</span>

              {/* Image preview + tint */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="h-11 w-11 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ border: "1px solid var(--border)", background: c.color ?? "var(--card-2)" }}>
                  {c.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                    : <span className="text-[9px] font-mono" style={{ color: "var(--text-2)" }}>sem img</span>}
                </div>
                <code className="text-[9px]" style={{ color: "var(--text-2)" }}>{c.slug}</code>
              </div>

              {/* Fields */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex gap-2 items-center">
                  <input value={c.name} onChange={(e) => patchLocal(c.id, { name: e.target.value })}
                    className="rounded-lg px-3 py-2 text-sm w-full font-semibold" style={inputStyle} />
                  <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-2)" }}>{c._count.markets} merc.</span>
                </div>

                <ImageUpload value={c.imageUrl ?? ""} onChange={(url) => patchLocal(c.id, { imageUrl: url })} />

                <div className="flex items-center gap-2 flex-wrap">
                  <input type="color" value={c.color ?? "#f3f4f6"} onChange={(e) => patchLocal(c.id, { color: e.target.value })}
                    className="h-8 w-8 rounded cursor-pointer" style={{ border: "1px solid var(--border-2)", background: "transparent" }} />
                  {PRESETS.map((p) => (
                    <button key={p} type="button" onClick={() => patchLocal(c.id, { color: p })}
                      className="h-5 w-5 rounded-full" style={{ background: p, border: (c.color ?? "").toLowerCase() === p ? "2px solid var(--text-0)" : "1px solid var(--border-2)" }} />
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => saveRow(c.id)} disabled={saving === c.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ background: "var(--green)" }}>
                    {saving === c.id ? "Salvando..." : "Salvar"}
                  </button>
                  <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-1)" }}>
                    <input type="checkbox" checked={c.showInNav} onChange={(e) => toggleNav(c.id, e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
                    Mostrar na navegação
                  </label>
                  <button onClick={() => removeRow(c)} className="ml-auto rounded-lg px-3 py-1.5 text-xs" style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New category */}
      <div className="mt-5 rounded-xl p-4" style={{ background: "var(--card-2)", border: "1px dashed var(--border-2)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-2)" }}>Nova categoria</p>
        <div className="flex gap-2 items-center flex-wrap">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome (ex: Esports)"
            className="rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]" style={inputStyle} />
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
            className="h-9 w-9 rounded cursor-pointer" style={{ border: "1px solid var(--border-2)", background: "transparent" }} />
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-1)" }}>
            <input type="checkbox" checked={newNav} onChange={(e) => setNewNav(e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
            Na navegação
          </label>
          <button onClick={addCategory} disabled={saving === "new"}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--green)" }}>
            {saving === "new" ? "..." : "+ Criar"}
          </button>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "var(--text-2)" }}>O slug é gerado do nome e não muda depois. A imagem você define aqui na lista.</p>
      </div>
    </div>
  )
}
