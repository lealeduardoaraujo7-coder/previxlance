"use client"
import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ImageUpload from "@/app/components/ImageUpload"
import { CategoryField, resolveCategory } from "@/app/components/CategoryField"
import { EventField } from "@/app/components/EventField"

export default function NovoMercadoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [newCatName, setNewCatName] = useState("")
  const [eventId, setEventId] = useState("")
  const [shortLabel, setShortLabel] = useState("")
  const [shortImageUrl, setShortImageUrl] = useState("")

  // Pre-fill event when arriving from "+ Adicionar mercado a este evento"
  useEffect(() => {
    const ev = new URLSearchParams(window.location.search).get("eventId")
    if (ev) setEventId(ev)
  }, [])
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "outros",
    type: "BINARY",
    closesAt: "",
  })
  const [featured, setFeatured] = useState(false)
  const [customOptions, setCustomOptions] = useState(["", ""])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addOption() {
    if (customOptions.length < 8) setCustomOptions((o) => [...o, ""])
  }

  function removeOption(i: number) {
    if (customOptions.length > 2) setCustomOptions((o) => o.filter((_, idx) => idx !== i))
  }

  function setOption(i: number, val: string) {
    setCustomOptions((o) => o.map((v, idx) => (idx === i ? val : v)))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (form.type === "MULTIPLE") {
      const filled = customOptions.filter((o) => o.trim())
      if (filled.length < 2) { setError("Adicione pelo menos 2 opções"); return }
    }
    if (eventId && !shortLabel.trim()) { setError("Rótulo curto é obrigatório para mercado dentro de um evento"); return }

    setLoading(true)

    // Resolve "+ Criar nova categoria" into a real slug (create or reuse)
    let categorySlug: string
    try {
      const resolved = await resolveCategory(form.category, newCatName)
      categorySlug = resolved.slug
    } catch (err: any) {
      setError(err.message || "Erro na categoria"); setLoading(false); return
    }

    const body = {
      ...form,
      category: categorySlug,
      featured,
      eventId: eventId || undefined,
      shortLabel: eventId ? shortLabel : undefined,
      shortImageUrl: eventId ? (shortImageUrl.trim() || undefined) : undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      options: form.type === "MULTIPLE" ? customOptions.filter((o) => o.trim()) : undefined,
    }

    const res = await fetch("/api/admin/mercados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Erro ao criar mercado")
      setLoading(false)
      return
    }

    router.push("/admin")
    router.refresh()
  }

  const inputClass = "w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200">← Voltar</Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Novo Mercado</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="Ex: O Flamengo vai ganhar o Brasileirão?"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Descrição (opcional)</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Regras ou contexto do mercado..."
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
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={inputClass}
            >
              <option value="BINARY">Sim / Não</option>
              <option value="MULTIPLE">Múltipla escolha</option>
            </select>
          </div>
        </div>

        {form.type === "MULTIPLE" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">Opções de resposta</label>
            <div className="space-y-2">
              {customOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Opção ${i + 1}`}
                    className={`${inputClass} flex-1`}
                  />
                  {customOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="rounded-xl border border-gray-200 dark:border-zinc-700 px-3 text-gray-400 dark:text-zinc-500 hover:border-red-300 dark:hover:border-red-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {customOptions.length < 8 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
              >
                + Adicionar opção
              </button>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Fecha em</label>
          <input
            type="datetime-local"
            value={form.closesAt}
            onChange={(e) => set("closesAt", e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <EventField eventId={eventId} onEventId={setEventId} shortLabel={shortLabel} onShortLabel={setShortLabel} shortImageUrl={shortImageUrl} onShortImageUrl={setShortImageUrl} inputClass={inputClass} />

        <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded accent-emerald-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
            Destacar na home
            <span className="block text-xs font-normal text-gray-400 dark:text-zinc-500">Exibe este mercado no carrossel de destaque</span>
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {loading ? "Criando..." : "Criar Mercado"}
        </button>
      </form>
    </div>
  )
}
