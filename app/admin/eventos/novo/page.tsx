"use client"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ImageUpload from "@/app/components/ImageUpload"
import { CategoryField, resolveCategory } from "@/app/components/CategoryField"

export default function NovoEventoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [newCatName, setNewCatName] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "outros",
    collection: "",
    closesAt: "",
  })

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))
  const inputClass = "w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    let categorySlug: string
    try {
      categorySlug = (await resolveCategory(form.category, newCatName)).slug
    } catch (err: any) {
      setError(err.message || "Erro na categoria"); setLoading(false); return
    }

    const res = await fetch("/api/admin/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, category: categorySlug, imageUrl: form.imageUrl.trim() || undefined }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Erro ao criar evento"); setLoading(false); return }
    // Go straight to editing so the admin can add child markets
    router.push(`/admin/eventos/${data.id}/editar`)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6">
        <Link href="/admin/eventos" className="text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200">← Voltar</Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Novo Evento</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Título</label>
          <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required
            placeholder="Ex: Quem vai ganhar o CBLOL 2026?" className={inputClass} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Descrição (opcional)</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Coleção (opcional)</label>
          <input type="text" value={form.collection} onChange={(e) => set("collection", e.target.value)}
            placeholder="Ex: CBLOL 2026 — aparece à direita no card" className={inputClass} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Imagem (opcional)</label>
          <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Categoria</label>
            <CategoryField value={form.category} onChange={(v) => set("category", v)} newName={newCatName} onNewName={setNewCatName} inputClass={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Fecha em</label>
            <input type="datetime-local" value={form.closesAt} onChange={(e) => set("closesAt", e.target.value)} required className={inputClass} />
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition-colors">
          {loading ? "Criando..." : "Criar evento e adicionar mercados"}
        </button>
      </form>
    </div>
  )
}
