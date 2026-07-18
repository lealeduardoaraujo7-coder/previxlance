"use client"
import { useState, useEffect, type FormEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import ImageUpload from "@/app/components/ImageUpload"
import { CategoryField, resolveCategory } from "@/app/components/CategoryField"
import { EventField } from "@/app/components/EventField"

function toDatetimeLocal(date: string) {
  return new Date(date).toISOString().slice(0, 16)
}

export default function EditarMercadoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [newCatName, setNewCatName] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "outros",
    closesAt: "",
  })
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState("OPEN")
  const [eventId, setEventId] = useState("")
  const [shortLabel, setShortLabel] = useState("")
  const [shortImageUrl, setShortImageUrl] = useState("")

  useEffect(() => {
    fetch(`/api/admin/mercados/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          imageUrl: data.imageUrl ?? "",
          category: data.category ?? "outros",
          closesAt: data.closesAt ? toDatetimeLocal(data.closesAt) : "",
        })
        setFeatured(Boolean(data.featured))
        setStatus(data.status ?? "OPEN")
        setEventId(data.eventId ?? "")
        setShortLabel(data.shortLabel ?? "")
        setShortImageUrl(data.shortImageUrl ?? "")
        setFetching(false)
      })
  }, [id])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (eventId && !shortLabel.trim()) { setError("Rótulo curto é obrigatório para mercado dentro de um evento"); setLoading(false); return }

    let categorySlug: string
    try {
      const resolved = await resolveCategory(form.category, newCatName)
      categorySlug = resolved.slug
    } catch (err: any) {
      setError(err.message || "Erro na categoria"); setLoading(false); return
    }

    const res = await fetch(`/api/admin/mercados/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, category: categorySlug, featured, eventId: eventId || null, shortLabel: eventId ? shortLabel : null, shortImageUrl: eventId ? (shortImageUrl.trim() || null) : null, imageUrl: form.imageUrl.trim() || undefined }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Erro ao salvar")
      setLoading(false)
      return
    }

    router.push("/admin")
    router.refresh()
  }

  const inputClass = "w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"

  if (fetching) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-gray-400">Carregando...</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200">← Voltar</Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Editar Mercado</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Título</label>
          <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required className={inputClass} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Descrição (opcional)</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Imagem (opcional)</label>
          <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Categoria</label>
            <CategoryField
              value={form.category}
              onChange={(v) => set("category", v)}
              newName={newCatName}
              onNewName={setNewCatName}
              inputClass={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Fecha em</label>
            <input type="datetime-local" value={form.closesAt} onChange={(e) => set("closesAt", e.target.value)} required className={inputClass} />
          </div>
        </div>

        <EventField eventId={eventId} onEventId={setEventId} shortLabel={shortLabel} onShortLabel={setShortLabel} shortImageUrl={shortImageUrl} onShortImageUrl={setShortImageUrl} inputClass={inputClass} />

        <label className={`flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 ${status === "OPEN" ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
          <input
            type="checkbox"
            checked={featured}
            disabled={status !== "OPEN"}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded accent-emerald-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
            Destacar na home
            <span className="block text-xs font-normal text-gray-400 dark:text-zinc-500">
              {status === "OPEN" ? "Exibe este mercado no carrossel de destaque" : "Só mercados abertos podem ser destacados"}
            </span>
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition-colors">
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  )
}
