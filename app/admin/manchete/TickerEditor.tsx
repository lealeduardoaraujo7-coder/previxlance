"use client"
import { useState } from "react"

type Item = {
  id: string
  label: string
  text: string
  color: string
  enabled: boolean
  order: number
}

const PRESETS = ["#00c076", "#60a5fa", "#a855f7", "#fb923c", "#ff4d4d", "#eab308", "#ec4899", "#14b8a6"]

export default function TickerEditor({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState("")

  function patchLocal(id: string, patch: Partial<Item>) {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  async function saveItem(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setSaving(id); setError("")
    const res = await fetch(`/api/admin/manchete/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: item.label, text: item.text, color: item.color, enabled: item.enabled }),
    })
    setSaving(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Erro ao salvar") }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    patchLocal(id, { enabled })
    const res = await fetch(`/api/admin/manchete/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    })
    if (!res.ok) patchLocal(id, { enabled: !enabled })
  }

  async function addItem() {
    setSaving("new"); setError("")
    const res = await fetch("/api/admin/manchete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "NOVO", text: "Novo item da manchete", color: "#00c076" }),
    })
    setSaving(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Erro ao criar"); return }
    const created = await res.json()
    setItems((list) => [...list, created])
  }

  async function removeItem(id: string) {
    if (!confirm("Remover este item da manchete?")) return
    const prev = items
    setItems((list) => list.filter((i) => i.id !== id))
    const res = await fetch(`/api/admin/manchete/${id}`, { method: "DELETE" })
    if (!res.ok) setItems(prev)
  }

  const enabledItems = items.filter((i) => i.enabled)
  const input = "rounded-lg px-3 py-2 text-sm focus:outline-none w-full"
  const inputStyle = { background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" } as const

  return (
    <div>
      {/* ── Live preview ── */}
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-2)" }}>Prévia</p>
        <div className="overflow-hidden rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)", height: 34 }}>
          <div className="flex items-center h-full overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {enabledItems.length === 0 ? (
              <span className="px-4 text-[11px]" style={{ color: "var(--text-2)" }}>Nenhum item ativo — a manchete fica oculta.</span>
            ) : enabledItems.map((it) => (
              <div key={it.id} className="flex items-center gap-2 px-6 whitespace-nowrap flex-shrink-0">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: it.color }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: it.color }}>{it.label}</span>
                <span className="text-[11px]" style={{ color: "var(--text-1)" }}>{it.text}</span>
                <span className="mx-3" style={{ color: "var(--border-2)" }}>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>{error}</p>
      )}

      {/* ── Items ── */}
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", opacity: it.enabled ? 1 : 0.55 }}>
            <div className="flex items-start gap-3">
              {/* Color */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <input type="color" value={it.color} onChange={(e) => patchLocal(it.id, { color: e.target.value })}
                  className="h-10 w-10 rounded-lg cursor-pointer" style={{ border: "1px solid var(--border-2)", background: "transparent" }} />
                <span className="text-[9px] tabular-nums" style={{ color: "var(--text-2)" }}>{it.color}</span>
              </div>

              {/* Fields */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex gap-2">
                  <input value={it.label} onChange={(e) => patchLocal(it.id, { label: e.target.value })}
                    placeholder="RÓTULO" className={input} style={{ ...inputStyle, maxWidth: 140, fontWeight: 700, textTransform: "uppercase" }} />
                  <div className="flex flex-wrap gap-1 items-center">
                    {PRESETS.map((c) => (
                      <button key={c} type="button" onClick={() => patchLocal(it.id, { color: c })}
                        className="h-5 w-5 rounded-full" style={{ background: c, border: it.color.toLowerCase() === c ? "2px solid var(--text-0)" : "1px solid var(--border-2)" }} />
                    ))}
                  </div>
                </div>
                <input value={it.text} onChange={(e) => patchLocal(it.id, { text: e.target.value })}
                  placeholder="Texto da notícia" className={input} style={inputStyle} />

                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => saveItem(it.id)} disabled={saving === it.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" style={{ background: "var(--green)" }}>
                    {saving === it.id ? "Salvando..." : "Salvar"}
                  </button>
                  <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-1)" }}>
                    <input type="checkbox" checked={it.enabled} onChange={(e) => toggleEnabled(it.id, e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
                    Ativo
                  </label>
                  <button onClick={() => removeItem(it.id)} className="ml-auto rounded-lg px-3 py-1.5 text-xs" style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addItem} disabled={saving === "new"}
        className="mt-4 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--card-2)", border: "1px dashed var(--border-2)", color: "var(--text-1)" }}>
        {saving === "new" ? "Adicionando..." : "+ Adicionar item"}
      </button>
    </div>
  )
}
