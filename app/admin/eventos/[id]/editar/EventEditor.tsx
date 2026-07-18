"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ImageUpload from "@/app/components/ImageUpload"
import { CategoryField, resolveCategory } from "@/app/components/CategoryField"

type Child = { id: string; title: string; shortLabel: string | null; shortImageUrl: string | null; status: string; totalPool: number; _count: { bets: number } }
type EventData = {
  id: string; slug: string; title: string; description: string | null; imageUrl: string | null
  category: string; collection: string | null; closesAt: string; status: string; featured: boolean
  markets: Child[]
}

function toLocal(d: string) { return new Date(d).toISOString().slice(0, 16) }

export default function EventEditor({ initial }: { initial: EventData }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [newCatName, setNewCatName] = useState("")

  const [form, setForm] = useState({
    title: initial.title,
    description: initial.description ?? "",
    imageUrl: initial.imageUrl ?? "",
    category: initial.category,
    collection: initial.collection ?? "",
    closesAt: initial.closesAt ? toLocal(initial.closesAt) : "",
    status: initial.status,
  })
  const [featured, setFeatured] = useState(initial.featured)
  const [children, setChildren] = useState<Child[]>(initial.markets)

  // Link existing
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<{ id: string; title: string }[]>([])
  const [linkTarget, setLinkTarget] = useState<{ id: string; title: string } | null>(null)
  const [linkLabel, setLinkLabel] = useState("")

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))
  const input = "w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none"

  async function saveEvent() {
    setSaving(true); setError("")
    let categorySlug: string
    try { categorySlug = (await resolveCategory(form.category, newCatName)).slug }
    catch (e: any) { setError(e.message); setSaving(false); return }

    const res = await fetch(`/api/admin/eventos/${initial.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, featured, category: categorySlug, imageUrl: form.imageUrl.trim() || null }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Erro ao salvar") ; return }
    router.refresh()
  }

  function patchChild(id: string, patch: Partial<Child>) {
    setChildren((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function saveChild(childId: string, over: Partial<Child> = {}) {
    setError("")
    const child = { ...children.find((c) => c.id === childId), ...over } as Child
    const res = await fetch(`/api/admin/mercados/${childId}/evento`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: initial.id, shortLabel: child.shortLabel ?? "", shortImageUrl: child.shortImageUrl ?? null }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Erro ao salvar filho") }
  }

  async function unlink(child: Child) {
    if (!confirm(`Desvincular "${child.title}" deste evento?\n\nEle volta a ser um mercado avulso e reaparece solto na home. NÃO é apagado.`)) return
    const res = await fetch(`/api/admin/mercados/${child.id}/evento`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: null }),
    })
    if (res.ok) setChildren((c) => c.filter((x) => x.id !== child.id))
  }

  async function runSearch(q: string) {
    setSearch(q)
    if (q.trim().length < 2) { setResults([]); return }
    const res = await fetch(`/api/admin/mercados/livres?q=${encodeURIComponent(q)}`)
    if (res.ok) setResults(await res.json())
  }

  async function confirmLink() {
    if (!linkTarget) return
    if (linkLabel.trim().length < 1) { setError("Informe o rótulo curto"); return }
    const res = await fetch(`/api/admin/mercados/${linkTarget.id}/evento`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: initial.id, shortLabel: linkLabel }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Erro ao vincular"); return }
    const m = await res.json()
    setChildren((c) => [...c, { id: linkTarget.id, title: linkTarget.title, shortLabel: linkLabel.trim(), shortImageUrl: null, status: m.market?.status ?? "OPEN", totalPool: m.market?.totalPool ?? 0, _count: { bets: 0 } }])
    setLinkTarget(null); setLinkLabel(""); setSearch(""); setResults([])
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <Link href="/admin/eventos" className="text-sm" style={{ color: "var(--text-2)" }}>← Voltar aos eventos</Link>
        <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--text-0)" }}>Editar Evento</h1>
        <code className="text-[11px]" style={{ color: "var(--text-2)" }}>{initial.slug}</code>
      </div>

      {error && <p className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>{error}</p>}

      {/* Event fields */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Título" className={input} />
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Descrição" className={`${input} resize-none`} />
        <input value={form.collection} onChange={(e) => set("collection", e.target.value)} placeholder="Coleção (ex: CBLOL 2026)" className={input} />
        <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
        <div className="grid grid-cols-2 gap-3">
          <CategoryField value={form.category} onChange={(v) => set("category", v)} newName={newCatName} onNewName={setNewCatName} inputClass={input} />
          <input type="datetime-local" value={form.closesAt} onChange={(e) => set("closesAt", e.target.value)} className={input} />
        </div>
        <select value={form.status} onChange={(e) => set("status", e.target.value)} className={input}>
          {["OPEN", "CLOSED", "RESOLVED", "CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-1)" }}>
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
          Destacar na home (carrossel)
        </label>
        <button onClick={saveEvent} disabled={saving} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar evento"}
        </button>
      </div>

      {/* Children */}
      <h2 className="mt-8 mb-3 text-lg font-bold" style={{ color: "var(--text-0)" }}>Mercados do evento ({children.length})</h2>
      <div className="space-y-2">
        {children.length === 0 && <p className="text-sm" style={{ color: "var(--text-2)" }}>Nenhum mercado vinculado ainda.</p>}
        {children.map((child) => (
          <div key={child.id} className="rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <input value={child.shortLabel ?? ""} onChange={(e) => patchChild(child.id, { shortLabel: e.target.value })} onBlur={() => saveChild(child.id)}
                placeholder="Rótulo" className="rounded-lg px-2.5 py-1.5 text-sm font-semibold" style={{ width: 110, background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-0)" }} />
              <span className="flex-1 min-w-0 text-sm truncate" style={{ color: "var(--text-1)" }}>{child.title}</span>
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>{child.status}</span>
              <button onClick={() => unlink(child)} title="Desvincular" className="rounded-lg px-2 py-1 text-sm" style={{ color: "#ef4444" }}>×</button>
            </div>
            <div className="mt-2">
              <label className="block text-[11px] mb-1" style={{ color: "var(--text-2)" }}>Imagem da linha (opcional)</label>
              <ImageUpload value={child.shortImageUrl ?? ""} onChange={(url) => { patchChild(child.id, { shortImageUrl: url }); saveChild(child.id, { shortImageUrl: url }) }} />
            </div>
          </div>
        ))}
      </div>

      {/* Add / link */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/admin/mercados/novo?eventId=${initial.id}`} className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,192,118,0.3)" }}>
          + Adicionar mercado novo
        </Link>
      </div>

      <div className="mt-4 rounded-xl p-4" style={{ background: "var(--card-2)", border: "1px dashed var(--border-2)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-2)" }}>Vincular mercado existente</p>
        <input value={search} onChange={(e) => runSearch(e.target.value)} placeholder="Buscar por título…" className={input} />
        {results.length > 0 && !linkTarget && (
          <div className="mt-2 space-y-1">
            {results.map((r) => (
              <button key={r.id} onClick={() => { setLinkTarget(r); setResults([]) }} className="block w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-[var(--card)]" style={{ color: "var(--text-1)" }}>
                {r.title}
              </button>
            ))}
          </div>
        )}
        {linkTarget && (
          <div className="mt-3 flex items-center gap-2">
            <span className="flex-1 min-w-0 text-sm truncate" style={{ color: "var(--text-0)" }}>{linkTarget.title}</span>
            <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Rótulo curto" className="rounded-lg px-2.5 py-1.5 text-sm" style={{ width: 120, background: "var(--card)", border: "1px solid var(--border-2)", color: "var(--text-0)" }} />
            <button onClick={confirmLink} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: "var(--green)" }}>Vincular</button>
            <button onClick={() => { setLinkTarget(null); setLinkLabel("") }} className="text-sm" style={{ color: "var(--text-2)" }}>cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}
